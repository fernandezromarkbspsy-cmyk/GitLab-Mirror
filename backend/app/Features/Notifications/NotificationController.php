<?php

namespace App\Features\Notifications;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class NotificationController
{
    public function index(Request $request): JsonResponse
    {
        $actor = $request->attributes->get('actor');
        $rows = DB::table('notifications')
            ->where(fn ($query) => $query->where('user_id', $actor->id)->orWhere('target_role', $actor->role))
            ->orderByDesc('created_at')->limit(50)->get();

        return response()->json(['data' => $rows, 'unread' => $rows->whereNull('read_at')->count()]);
    }

    public function read(Request $request, int $id): JsonResponse
    {
        $actor = $request->attributes->get('actor');
        $updated = DB::table('notifications')->where('id', $id)
            ->where(fn ($query) => $query->where('user_id', $actor->id)->orWhere('target_role', $actor->role))
            ->update(['read_at' => now()]);
        abort_unless($updated, 404, 'Notification not found.');

        return response()->json(['ok' => true]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $actor = $request->attributes->get('actor');
        DB::table('notifications')->whereNull('read_at')
            ->where(fn ($query) => $query->where('user_id', $actor->id)->orWhere('target_role', $actor->role))
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
