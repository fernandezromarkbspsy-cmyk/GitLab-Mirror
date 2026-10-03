<?php

namespace App\Features\Approvals;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class PresenceController
{
    public function heartbeat(Request $request): JsonResponse
    {
        $actor = $request->attributes->get('actor');
        abort_unless($actor && $actor->role === 'fte_ops', 403, 'Only FTE Ops users can send approval presence heartbeats.');

        DB::table('profiles')->where('id', $actor->id)->update(['last_seen_at' => now(), 'updated_at' => now()]);

        return response()->json([
            'ok' => true,
            'last_seen_at' => now()->toIso8601String(),
            'active_for_seconds' => (int) config('services.seatalk.approval.presence_active_seconds', 60),
        ]);
    }
}
