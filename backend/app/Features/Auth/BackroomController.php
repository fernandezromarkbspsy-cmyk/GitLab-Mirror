<?php

namespace App\Features\Auth;

use App\Integrations\SupabaseHttpOptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

final class BackroomController
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ops_id' => ['required', 'string', 'max:40', 'regex:/^ops[0-9]+$/i'],
            'password' => ['required', 'string', 'max:200'],
            'mode' => ['sometimes', 'string', 'in:first-login,normal'],
        ]);
        $opsId = strtolower(trim($data['ops_id']));
        $profile = DB::table('profiles')
            ->whereRaw('lower(ops_id) = ?', [$opsId])
            ->where('role', 'ops_pic')
            ->where('is_active', true)
            ->first(['id', 'must_change_password']);

        abort_unless($profile, 404, 'Ops ID was not found or is inactive.');
        if (($data['mode'] ?? null) === 'first-login') {
            abort_unless($profile->must_change_password, 409, 'This account has already completed first login.');
        }

        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $anonKey = (string) config('services.supabase.anon_key');
        abort_if($supabaseUrl === '' || $anonKey === '', 503, 'Backroom login is not configured.');

        $tokenResponse = Http::withHeaders(['apikey' => $anonKey])
            ->withOptions(SupabaseHttpOptions::guzzle())
            ->withOptions(['verify' => config('services.supabase.ca_bundle') ?: true])
            ->connectTimeout(5)
            ->timeout(10)
            ->post($supabaseUrl.'/auth/v1/token?grant_type=password', [
                'email' => $opsId.'@backroom.soc5.internal',
                'password' => $data['password'],
            ]);
        abort_unless($tokenResponse->successful() && $tokenResponse->json('access_token'), 401, 'Invalid Ops ID or password.');

        return response()->json($tokenResponse->json());
    }
}
