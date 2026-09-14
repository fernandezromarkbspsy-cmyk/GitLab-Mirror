<?php

namespace App\Features\Auth;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

final class BackroomController
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ops_id' => ['required', 'string', 'max:40', 'regex:/^ops[0-9]+$/i'],
            'mode' => ['required', 'string', 'in:first-login'],
        ]);
        $opsId = strtolower(trim($data['ops_id']));
        $profile = DB::table('profiles')
            ->whereRaw('lower(ops_id) = ?', [$opsId])
            ->where('role', 'ops_pic')
            ->where('is_active', true)
            ->first(['id', 'must_change_password']);

        abort_unless($profile, 404, 'Ops ID was not found or is inactive.');
        if ($data['mode'] === 'first-login') {
            abort_unless($profile->must_change_password, 409, 'This account has already completed first login.');
        }

        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $serviceKey = (string) config('services.supabase.service_key');
        $anonKey = (string) config('services.supabase.anon_key');
        abort_if($supabaseUrl === '' || $serviceKey === '' || $anonKey === '', 503, 'Backroom login is not configured.');

        $temporaryPassword = Str::random(64);
        $headers = ['apikey' => $serviceKey, 'Authorization' => 'Bearer '.$serviceKey];
        $passwordResponse = Http::withHeaders($headers)
            ->withOptions(['proxy' => config('services.supabase.http_proxy') ?: false])
            ->withOptions(['verify' => config('services.supabase.ca_bundle') ?: true])
            ->connectTimeout(5)
            ->timeout(10)
            ->put($supabaseUrl.'/auth/v1/admin/users/'.$profile->id, ['password' => $temporaryPassword]);
        abort_unless($passwordResponse->successful(), 502, 'Unable to prepare the Backroom login.');

        $tokenResponse = Http::withHeaders(['apikey' => $anonKey])
            ->withOptions(['proxy' => config('services.supabase.http_proxy') ?: false])
            ->withOptions(['verify' => config('services.supabase.ca_bundle') ?: true])
            ->connectTimeout(5)
            ->timeout(10)
            ->post($supabaseUrl.'/auth/v1/token?grant_type=password', [
                'email' => $opsId.'@backroom.soc5.internal',
                'password' => $temporaryPassword,
            ]);
        abort_unless($tokenResponse->successful() && $tokenResponse->json('access_token'), 502, 'Unable to start the Backroom password change.');

        return response()->json($tokenResponse->json());
    }
}