<?php

namespace App\Features\Requests;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class RequestService
{
    public function __construct(private RequestRepository $requests, private RequestAuthorizer $authorizer) {}

    public function create(object $actor, array $data): object
    {
        abort_unless(in_array($actor->role, ['ops_pic', 'fte_ops'], true), 403);

        return DB::transaction(function () use ($actor, $data) {
            $request = $this->requests->insert($data + ['id' => (string) Str::uuid(), 'created_by' => $actor->id, 'status' => 'PENDING']);
            $this->event($request->id, $actor->id, 'REQUEST_CREATED', null, 'PENDING', [
                'lh_type_request' => $data['truck_type'] ?? null,
            ]);
            $this->notify($request->id, 'fte_ops', 'REQUEST_CREATED', 'New request', 'A truck request needs review.');

            return $request;
        });
    }

    public function updateDetails(string $id, object $actor, array $data): object
    {
        abort_unless($this->authorizer->canEdit($actor), 403, 'Only FTE Ops can edit requests.');

        return DB::transaction(function () use ($id, $actor, $data) {
            $request = $this->requests->lock($id);
            abort_unless(in_array($request->status, ['PENDING', 'REJECTED_BY_MM'], true), 409, "Cannot edit a {$request->status} request.");
            $updated = $this->requests->update($id, $data);
            $this->event($id, $actor->id, 'REQUEST_EDITED', $request->status, $request->status, $data);

            return $updated;
        });
    }

    public function transition(string $id, object $actor, string $action, array $input): object
    {
        return DB::transaction(function () use ($id, $actor, $action, $input) {
            $request = $this->requests->lock($id);
            [$from, $to, $event] = match ($action) {
                'approve' => [['PENDING', 'REJECTED_BY_MM'], 'APPROVED', 'REQUEST_APPROVED'],
                'reject-ops' => [['PENDING', 'REJECTED_BY_MM'], 'CANCELLED', 'REQUEST_REJECTED_BY_OPS'],
                'cancel' => [['PENDING', 'REJECTED_BY_MM'], 'CANCELLED', 'REQUEST_CANCELLED'],
                'reject-mm' => [['APPROVED'], 'REJECTED_BY_MM', 'REQUEST_REJECTED_BY_MM'],
                'assign-truck' => [['APPROVED'], 'ASSIGNED', 'TRUCK_ASSIGNED'],
                'mark-docked' => [['FOR_DOCKING'], 'FOR_DOCKING', 'TRUCK_DOCKED'],
                'confirm' => [['DOCKED'], 'CONFIRMED', 'REQUEST_CONFIRMED'],
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
            if ($action === 'confirm' && (blank($input['driver_id'] ?? $request->driver_id) || blank($input['linehaul_trip_no'] ?? $request->linehaul_trip_no))) {
                throw ValidationException::withMessages(['driver_id' => 'Driver ID and linehaul trip number are required.']);
            }

            $fields = array_intersect_key($input, array_flip(['rejection_remarks', 'plate_number', 'provide_time', 'driver_id', 'linehaul_trip_no', 'truck_size', 'truck_type', 'docked_time']));
            if ($action === 'mark-docked') {
                $driverId = $input['driver_id'] ?? $request->driver_id;
                $tripNo = $input['linehaul_trip_no'] ?? $request->linehaul_trip_no;
                if (blank($driverId) || blank($tripNo)) {
                    $updated = $this->requests->update($id, $fields);

                    return $updated;
                }
            }
            $fields['status'] = $to;
            if ($to === 'APPROVED') {
                $fields['approved_at'] = now();
            }
            if ($to === 'REJECTED_BY_MM') {
                $fields['rejected_at'] = now();
            }
            if ($to === 'DOCKED' && blank($fields['docked_time'] ?? null)) {
                $fields['docked_time'] = now();
            }
            if ($to === 'CONFIRMED') {
                $fields['confirmed_at'] = now();
            }
            $updated = $this->requests->update($id, $fields);
            $this->event($id, $actor->id, $event, $request->status, $to, $input);
            if ($action === 'assign-truck') {
                $updated = $this->requests->update($id, ['status' => 'FOR_DOCKING']);
                $this->event($id, $actor->id, 'TRUCK_FOR_DOCKING', 'ASSIGNED', 'FOR_DOCKING');
            }
            $target = match ($action === 'assign-truck' ? 'FOR_DOCKING' : $to) {
                'APPROVED' => 'fte_mm', 'REJECTED_BY_MM' => 'fte_ops', 'FOR_DOCKING' => 'doc_officer', 'CONFIRMED' => 'fte_ops', default => null
            };
            if ($target) {
                $notificationEvent = $action === 'assign-truck' ? 'TRUCK_FOR_DOCKING' : $event;
                $this->notify($id, $target, $notificationEvent, str_replace('_', ' ', $notificationEvent), "Request {$id} is now {$to}.");
                if ($to === 'CONFIRMED') {
                    $this->notify($id, 'fte_mm', $event, str_replace('_', ' ', $event), "Request {$id} is now {$to}.");
                }
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
