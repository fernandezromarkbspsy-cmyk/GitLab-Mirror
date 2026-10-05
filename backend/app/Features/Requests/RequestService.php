<?php

namespace App\Features\Requests;

use App\Features\Approvals\ApprovalActor;
use App\Features\Approvals\ApprovalItemProvisioner;
use App\Features\Approvals\ApprovalService;
use App\Features\Approvals\ApprovalSource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class RequestService
{
    public function __construct(
        private RequestRepository $requests,
        private RequestAuthorizer $authorizer,
        ?ApprovalService $approvals = null,
        ?ApprovalItemProvisioner $provisioner = null,
    ) {
        $this->approvals = $approvals ?? new ApprovalService($requests, $authorizer);
        $this->provisioner = $provisioner;
    }

    private ApprovalService $approvals;

    private ?ApprovalItemProvisioner $provisioner;

    public function create(object $actor, array $data): object
    {
        abort_unless(in_array($actor->role, ['ops_pic', 'fte_ops'], true), 403);

        return DB::transaction(function () use ($actor, $data) {
            $request = $this->requests->insert($data + ['id' => (string) Str::uuid(), 'created_by' => $actor->id, 'status' => 'PENDING']);
            $this->event($request->id, $actor->id, 'REQUEST_CREATED', null, 'PENDING', [
                'lh_type_request' => $data['truck_type'] ?? null,
            ]);
            $this->notify($request->id, 'fte_ops', 'REQUEST_CREATED', 'New request', 'A truck request needs review.');
            if ($this->provisioner !== null) {
                DB::afterCommit(function () use ($request): void {
                    $this->provisioner?->provisionForRequest($request);
                });
            }

            return $request;
        });
    }

    public function updateDetails(string $id, object $actor, array $data): object
    {
        abort_unless($this->authorizer->canEdit($actor), 403, 'Only FTE Ops can edit requests.');

        return DB::transaction(function () use ($id, $actor, $data) {
            $request = $this->requests->lock($id);
            abort_unless(in_array($request->status, ['PENDING', 'REROUTED'], true), 409, "Cannot edit a {$request->status} request.");
            $updated = $this->requests->update($id, $data + ['status' => 'REQUESTED']);
            $this->event($id, $actor->id, 'REQUEST_EDITED', $request->status, 'REQUESTED', $data);
            $this->notifyUser($id, $request->created_by, 'REQUEST_EDITED', 'Request updated', "Request {$id} was updated by FTE Ops.");

            return $updated;
        });
    }

    public function transition(string $id, object $actor, string $action, array $input): object
    {
        if ($action === 'approve') {
            return $this->approvals->approve($id, ApprovalActor::fromObject($actor), ApprovalSource::Web)->request;
        }

        if ($action === 'reject-mm') {
            return $this->approvals->reject(
                $id,
                ApprovalActor::fromObject($actor),
                ApprovalSource::Web,
                null,
                (string) ($input['rejection_remarks'] ?? ''),
            )->request;
        }

        return DB::transaction(function () use ($id, $actor, $action, $input) {
            $request = $this->requests->lock($id);
            [$from, $to, $event] = match ($action) {
                'approve' => [['PENDING', 'REROUTED'], 'REQUESTED', 'REQUEST_APPROVED'],
                'reject-ops' => [['PENDING', 'REROUTED'], 'REROUTED', 'REQUEST_REJECTED_BY_OPS'],
                'cancel' => [['PENDING', 'REROUTED'], 'CANCELLED', 'REQUEST_CANCELLED'],
                'reject-mm' => [['REQUESTED'], 'CANCELLED', 'REQUEST_REJECTED_BY_MM'],
                'assign-truck' => [['REQUESTED'], 'DOCKING', 'TRUCK_ASSIGNED'],
                'mark-docked' => $actor->role === 'doc_officer'
                    ? [['DOCKING'], 'DOCKING', 'DRIVER_ASSIGNED']
                    : [['DOCKING'], 'DOCKED', 'TRUCK_DOCKED'],
                default => throw ValidationException::withMessages(['action' => 'Unknown action.']),
            };
            abort_unless(in_array($request->status, $from, true), 409, "Cannot {$action} a {$request->status} request.");
            abort_unless($this->authorizer->canTransition($actor, $action, $request), 403);
            if ($action === 'reject-mm' && blank($input['rejection_remarks'] ?? null)) {
                throw ValidationException::withMessages(['rejection_remarks' => 'A rejection reason is required.']);
            }
            if ($action === 'assign-truck' && blank($input['plate_number'] ?? null)) {
                throw ValidationException::withMessages(['plate_number' => 'Plate number is required.']);
            }
            if ($action === 'mark-docked' && $actor->role !== 'doc_officer' && blank($request->driver_id)) {
                throw ValidationException::withMessages(['driver_id' => 'Driver ID is required before entering the linehaul trip number.']);
            }

            $allowedFields = match ($action) {
                'reject-ops', 'reject-mm' => ['rejection_remarks'],
                'assign-truck' => ['plate_number', 'provide_time', 'truck_size', 'truck_type'],
                'mark-docked' => $actor->role === 'doc_officer' ? ['driver_id'] : ['linehaul_trip_no'],
                default => [],
            };
            $fields = array_intersect_key($input, array_flip($allowedFields));
            if ($action === 'assign-truck') {
                $fields['provide_time'] = now();
            }
            if ($action === 'mark-docked') {
                if ($actor->role === 'doc_officer') {
                    $fields['driver_assigned_at'] = now();
                } else {
                    $fields['linehaul_trip_at'] = now();
                }
            }
            $fields['status'] = $to;
            if ($to === 'REQUESTED') {
                $fields['approved_at'] = now();
            }
            if ($to === 'CANCELLED' && $action === 'reject-mm') {
                $fields['rejected_at'] = now();
            }
            if ($to === 'DOCKED' && blank($fields['docked_time'] ?? null)) {
                $fields['docked_time'] = now();
            }
            $updated = $this->requests->update($id, $fields);
            $this->event($id, $actor->id, $event, $request->status, $to, $fields);
            if (in_array($to, ['CANCELLED', 'DOCKED'], true)) {
                $this->approvals->closeAssignments($id, strtolower($event));
                $this->approvals->synchronizeAfterCommit($id);
            }
            $target = match ($to) {
                'REQUESTED' => 'fte_mm', 'DOCKING' => 'doc_officer', 'REROUTED' => 'fte_mm', default => null
            };
            if ($target) {
                $this->notify($id, $target, $event, str_replace('_', ' ', $event), "Request {$id} is now {$to}.");
            }
            if ($action === 'reject-ops') {
                $this->notifyUser($id, $request->created_by, $event, 'Request rejected', "Request {$id} was rejected by FTE Ops.");
            }

            return $updated;
        });
    }

    public function bulkApprove(object $actor, array $ids): array
    {
        abort_unless($actor->role === 'fte_ops', 403, 'Only FTE Ops can bulk approve requests.');

        return DB::transaction(function () use ($actor, $ids): array {
            $approved = [];
            foreach ($ids as $id) {
                $approved[] = $this->transition($id, $actor, 'approve', []);
            }

            return $approved;
        });
    }

    private function event(string $id, string $actor, string $type, ?string $from, string $to, array $meta = []): void
    {
        DB::table('request_events')->insert(['request_id' => $id, 'actor_id' => $actor, 'event_type' => $type, 'from_status' => $from, 'to_status' => $to, 'metadata' => json_encode($meta)]);
    }

    private function notify(string $id, string $role, string $event, string $title, string $body): void
    {
        DB::table('notifications')->insert(['request_id' => $id, 'target_role' => $role, 'event_type' => $event, 'title' => $title, 'body' => $body]);
    }

    private function notifyUser(string $id, string $userId, string $event, string $title, string $body): void
    {
        DB::table('notifications')->insert(['request_id' => $id, 'user_id' => $userId, 'event_type' => $event, 'title' => $title, 'body' => $body]);
    }
}
