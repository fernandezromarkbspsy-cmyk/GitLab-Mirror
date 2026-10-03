<?php

namespace App\Features\Approvals;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final class SeaTalkApprovalCallbackController
{
    public function __construct(
        private ApprovalService $approvals,
        private ?ApprovalItemSynchronizer $synchronizer = null,
    ) {}

    public function approve(Request $request): JsonResponse
    {
        return $this->handle($request, 'approve');
    }

    public function reject(Request $request): JsonResponse
    {
        return $this->handle($request, 'reject');
    }

    private function handle(Request $request, string $action): JsonResponse
    {
        $data = $request->validate([
            'item_id' => ['required', 'string', 'max:100'],
            'event_id' => ['required', 'string', 'max:255'],
            'timestamp' => ['required', 'integer'],
            'employee.employee_code' => ['required', 'string', 'max:255'],
            'reason' => [$action === 'reject' ? 'required' : 'nullable', 'string', 'max:500'],
        ]);

        $eventId = (string) $data['event_id'];
        $item = $this->resolveItem((string) $data['item_id']);
        $assignment = $this->resolveAssignment($item, (string) data_get($data, 'employee.employee_code'));

        $inserted = DB::table('seatalk_callback_events')->insertOrIgnore([
            'event_id' => $eventId,
            'provider_item_id' => (string) $data['item_id'],
            'request_id' => $item->request_id,
            'employee_code' => (string) data_get($data, 'employee.employee_code'),
            'action' => $action,
            'status' => $assignment === null ? 'ignored' : 'received',
            'received_at' => now(),
            'correlation_id' => (string) Str::uuid(),
        ]);
        if ($inserted === 0) {
            return $this->acknowledge('duplicate');
        }
        if ($assignment === null) {
            DB::table('seatalk_callback_events')->where('event_id', $eventId)->update(['status' => 'ignored', 'processed_at' => now()]);

            return $this->acknowledge('ignored');
        }

        $profile = DB::table('profiles')->where('id', $assignment->fte_user_id)->first(['id', 'role', 'seatalk_employee_code']);
        if ($profile === null || (string) $profile->seatalk_employee_code !== (string) data_get($data, 'employee.employee_code')) {
            return $this->acknowledge('ignored');
        }

        $actor = new ApprovalActor((string) $profile->id, (string) $profile->role, (string) $profile->seatalk_employee_code);
        $result = $action === 'approve'
            ? $this->approvals->approve((string) $item->request_id, $actor, ApprovalSource::SeaTalk, (string) $assignment->id)
            : $this->approvals->reject((string) $item->request_id, $actor, ApprovalSource::SeaTalk, (string) $assignment->id, (string) $data['reason']);

        DB::table('seatalk_approval_assignments')->where('id', $assignment->id)->update([
            'status' => $action === 'approve' ? 'APPROVED' : 'REJECTED',
            'responded_at' => now(),
            'provider_response_id' => $eventId,
            'updated_at' => now(),
        ]);
        DB::table('seatalk_callback_events')->where('event_id', $eventId)->update(['status' => $result->accepted ? 'processed' : 'ignored', 'processed_at' => now()]);
        $this->synchronizer?->synchronize((string) $item->request_id);
        Log::info('SeaTalk approval callback processed.', [
            'event_id' => $eventId,
            'request_id' => $item->request_id,
            'action' => $action,
            'idempotent' => $result->idempotent,
        ]);

        return $this->acknowledge($result->idempotent ? 'duplicate' : 'processed');
    }

    private function resolveItem(string $providerItemId): object
    {
        $item = DB::table('seatalk_approval_items')->where('provider_item_id', $providerItemId)->first();
        if ($item === null) {
            $item = DB::table('seatalk_approval_items')->where('id', $providerItemId)->first();
        }
        abort_unless($item, 404, 'SeaTalk approval item was not found.');

        return $item;
    }

    private function resolveAssignment(object $item, string $employeeCode): ?object
    {
        return DB::table('seatalk_approval_assignments as assignments')
            ->join('profiles', 'profiles.id', '=', 'assignments.fte_user_id')
            ->where('assignments.request_id', $item->request_id)
            ->whereIn('assignments.status', ['PENDING', 'ACTIVE'])
            ->where('profiles.seatalk_employee_code', $employeeCode)
            ->lockForUpdate()
            ->first(['assignments.*']);
    }

    private function acknowledge(string $status): JsonResponse
    {
        return response()->json(['code' => 0, 'status' => $status]);
    }
}
