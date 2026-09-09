<?php

namespace App\Features\Users;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class AccessRequestController
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'ops_id' => ['required', 'string', 'max:40', 'regex:/^ops[0-9]+$/i'],
        ]);

        $name = trim($data['name']);
        $opsId = strtolower(trim($data['ops_id']));
        $body = "{$name} requested Backroom access with Ops ID {$opsId}. Create the account from User Management after verification.";

        DB::table('notifications')->insert([
            [
                'target_role' => 'fte_ops',
                'event_type' => 'BACKROOM_ACCESS_REQUESTED',
                'title' => 'Backroom access requested',
                'body' => $body,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'target_role' => 'fte_mm',
                'event_type' => 'BACKROOM_ACCESS_REQUESTED',
                'title' => 'Backroom access requested',
                'body' => $body,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        return response()->json(['ok' => true], 201);
    }
}
