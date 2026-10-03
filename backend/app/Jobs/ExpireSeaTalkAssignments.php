<?php

namespace App\Jobs;

use App\Features\Approvals\ApprovalRouter;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

final class ExpireSeaTalkAssignments implements ShouldQueue
{
    public function __construct() {}

    public function handle(ApprovalRouter $router): void
    {
        if (! Schema::hasTable('seatalk_approval_assignments')) {
            return;
        }

        $expired = DB::transaction(function (): array {
            return DB::table('seatalk_approval_assignments')
                ->whereIn('status', ['PENDING', 'ACTIVE'])
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', now())
                ->lockForUpdate()
                ->get(['id', 'request_id'])
                ->map(function (object $assignment): string {
                    DB::table('seatalk_approval_assignments')->where('id', $assignment->id)->update([
                        'status' => 'EXPIRED',
                        'responded_at' => now(),
                        'updated_at' => now(),
                    ]);

                    return (string) $assignment->request_id;
                })
                ->unique()
                ->values()
                ->all();
        });

        foreach ($expired as $requestId) {
            $router->assignNext($requestId);
        }
        if ($expired !== []) {
            Log::info('SeaTalk approval assignments expired.', ['request_count' => count($expired)]);
        }
    }
}
