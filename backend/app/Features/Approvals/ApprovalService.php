<?php

namespace App\Features\Approvals;

use App\Features\Requests\RequestAuthorizer;
use App\Features\Requests\RequestRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class ApprovalService
{
    public function __construct(
        private RequestRepository $requests,
        private RequestAuthorizer $authorizer,
        ?ApprovalItemSynchronizer $synchronizer = null,
    ) {
        $this->synchronizer = $synchronizer;
    }

    private ?ApprovalItemSynchronizer $synchronizer;

    public function synchronizeAfterCommit(string $requestId): void
    {
        if ($this->synchronizer === null) {
            return;
        }

        DB::afterCommit(function () use ($requestId): void {
            $this->synchronizer?->synchronize($requestId);
        });
    }

    public function approve(string $requestId, ApprovalActor $actor, ApprovalSource $source, ?string $assignmentId = null): ApprovalResult
    {
        return DB::transaction(function () use ($requestId, $actor, $source, $assignmentId): ApprovalResult {
            $request = $this->requests->lock($requestId);

            if ($this->alreadyApproved($request)) {
                return new ApprovalResult($request, true, true);
            }

            abort_unless(in_array($request->status, ['PENDING', 'REROUTED'], true), 409, "Cannot approve a {$request->status} request.");
            abort_unless($this->authorizer->canTransition((object) $actor, 'approve', $request), 403);
            $this->assertActiveAssignment($requestId, $assignmentId, $actor->id);

            $correlationId = (string) Str::uuid();
            $fields = ['status' => 'REQUESTED'];
            $fields += $this->metadataFields([
                'approval_status' => 'APPROVED',
                'approved_by' => $actor->id,
                'approved_at' => now(),
                'approval_source' => $source->value,
                'approval_version' => DB::raw('approval_version + 1'),
                'approval_correlation_id' => $correlationId,
            ]);

            $updated = $this->requests->update($requestId, $fields);
            $this->event($requestId, $actor->id, 'REQUEST_APPROVED', $request->status, 'REQUESTED', [
                'source' => $source->value,
                'correlation_id' => $correlationId,
                'assignment_id' => $assignmentId,
            ]);
            $this->notify($requestId, 'fte_mm', 'REQUEST_APPROVED', 'Request approved', "Request {$requestId} is now REQUESTED.");

            $this->closeAssignments($requestId, 'approved');
            $this->synchronizeAfterCommit($requestId);

            return new ApprovalResult($updated, true);
        });
    }

    public function reject(string $requestId, ApprovalActor $actor, ApprovalSource $source, ?string $assignmentId, string $reason): ApprovalResult
    {
        if (blank($reason)) {
            throw ValidationException::withMessages(['rejection_remarks' => 'A rejection reason is required.']);
        }

        return DB::transaction(function () use ($requestId, $actor, $source, $assignmentId, $reason): ApprovalResult {
            $request = $this->requests->lock($requestId);

            if ($actor->role === 'fte_ops') {
                abort_unless(in_array($request->status, ['PENDING', 'REROUTED'], true), 409, "Cannot reject a {$request->status} request.");
                abort_unless($this->authorizer->canTransition((object) $actor, 'reject-ops', $request), 403);
                $this->assertActiveAssignment($requestId, $assignmentId, $actor->id);

                $correlationId = (string) Str::uuid();
                $fields = ['status' => 'REROUTED', 'rejection_remarks' => $reason];
                $fields += $this->metadataFields([
                    'approval_status' => 'PENDING',
                    'approval_source' => $source->value,
                    'approval_version' => DB::raw('approval_version + 1'),
                    'approval_correlation_id' => $correlationId,
                ]);
                $updated = $this->requests->update($requestId, $fields);
                $this->event($requestId, $actor->id, 'REQUEST_REJECTED_BY_OPS', $request->status, 'REROUTED', [
                    'rejection_remarks' => $reason,
                    'source' => $source->value,
                    'correlation_id' => $correlationId,
                    'assignment_id' => $assignmentId,
                ]);
                $this->notifyUser($requestId, (string) $request->created_by, 'REQUEST_REJECTED_BY_OPS', 'Request rejected', "Request {$requestId} was rejected by FTE Ops.");
                $this->closeAssignments($requestId, 'rejected_by_ops');
                $this->synchronizeAfterCommit($requestId);

                return new ApprovalResult($updated, true);
            }

            if ($this->alreadyRejected($request)) {
                return new ApprovalResult($request, true, true);
            }

            abort_unless($request->status === 'REQUESTED', 409, "Cannot reject a {$request->status} request.");
            abort_unless($this->authorizer->canTransition((object) $actor, 'reject-mm', $request), 403);
            $this->assertActiveAssignment($requestId, $assignmentId, $actor->id);

            $correlationId = (string) Str::uuid();
            $fields = [
                'status' => 'CANCELLED',
                'rejection_remarks' => $reason,
            ];
            $fields += $this->metadataFields([
                'approval_status' => 'REJECTED',
                'rejected_by' => $actor->id,
                'rejected_at' => now(),
                'approval_source' => $source->value,
                'approval_version' => DB::raw('approval_version + 1'),
                'approval_correlation_id' => $correlationId,
            ]);

            $updated = $this->requests->update($requestId, $fields);
            $this->event($requestId, $actor->id, 'REQUEST_REJECTED_BY_MM', $request->status, 'CANCELLED', [
                'rejection_remarks' => $reason,
                'source' => $source->value,
                'correlation_id' => $correlationId,
                'assignment_id' => $assignmentId,
            ]);
            $this->closeAssignments($requestId, 'rejected');
            $this->synchronizeAfterCommit($requestId);

            return new ApprovalResult($updated, true);
        });
    }

    public function closeAssignments(string $requestId, string $reason): void
    {
        if (! Schema::hasTable('seatalk_approval_assignments')) {
            return;
        }

        DB::table('seatalk_approval_assignments')
            ->where('request_id', $requestId)
            ->whereIn('status', ['PENDING', 'ACTIVE'])
            ->update(['status' => 'CLOSED', 'failure_reason' => $reason, 'updated_at' => now()]);
    }

    private function metadataFields(array $fields): array
    {
        $available = [];
        foreach ($fields as $column => $value) {
            if (Schema::hasColumn('requests', $column)) {
                $available[$column] = $value;
            }
        }

        return $available;
    }

    private function assertActiveAssignment(string $requestId, ?string $assignmentId, string $actorId): void
    {
        if ($assignmentId === null || ! Schema::hasTable('seatalk_approval_assignments')) {
            return;
        }

        $query = DB::table('seatalk_approval_assignments')
            ->where('id', $assignmentId)
            ->where('request_id', $requestId)
            ->where('status', 'ACTIVE');
        if (Schema::hasColumn('seatalk_approval_assignments', 'fte_user_id')) {
            $query->where('fte_user_id', $actorId);
        }

        abort_unless($query->exists(), 409, 'The approval assignment is no longer active.');
    }

    private function alreadyApproved(object $request): bool
    {
        return $request->status === 'REQUESTED'
            && (($request->approval_status ?? null) === 'APPROVED');
    }

    private function alreadyRejected(object $request): bool
    {
        return $request->status === 'CANCELLED'
            && (($request->approval_status ?? null) === 'REJECTED');
    }

    private function event(string $id, string $actor, string $type, ?string $from, string $to, array $meta = []): void
    {
        DB::table('request_events')->insert([
            'request_id' => $id,
            'actor_id' => $actor,
            'event_type' => $type,
            'from_status' => $from,
            'to_status' => $to,
            'metadata' => json_encode($meta),
        ]);
    }

    private function notify(string $id, string $role, string $event, string $title, string $body): void
    {
        DB::table('notifications')->insert([
            'request_id' => $id,
            'target_role' => $role,
            'event_type' => $event,
            'title' => $title,
            'body' => $body,
        ]);
    }
}
