<?php

namespace App\Features\Auth;

use App\Integrations\SupabaseHttpOptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

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

    public function changePassword(Request $request): JsonResponse
    {
        $actor = $request->attributes->get('actor');
        abort_unless($actor->role === 'ops_pic', 403, 'Only Backroom accounts use this flow.');
        abort_unless($actor->must_change_password && $actor->password_reset_at, 409, 'Password change is not required.');

        $data = $request->validate([
            'password' => ['required', 'string', 'min:12', 'max:200'],
        ]);
        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $anonKey = (string) config('services.supabase.anon_key');
        $token = $request->bearerToken();
        abort_unless($token, 401, 'A bearer token is required to change the password.');
        abort_if($supabaseUrl === '' || $anonKey === '', 503, 'Password change is not configured.');

        try {
            $response = Http::withHeaders(['apikey' => $anonKey])
                ->withToken($token)
                ->withOptions(SupabaseHttpOptions::guzzle())
                ->withOptions(['verify' => config('services.supabase.ca_bundle') ?: true])
                ->connectTimeout(config('services.supabase.connect_timeout', 5))
                ->timeout(config('services.supabase.timeout', 10))
                ->put($supabaseUrl.'/auth/v1/user', ['password' => $data['password']]);
        } catch (Throwable $exception) {
            Log::warning('Unable to reach Supabase during Backroom password change.', [
                'user_id' => $actor->id,
                'error' => $exception->getMessage(),
            ]);
            abort(502, 'Unable to change the Backroom password.');
        }

        if (! $response->successful() || $response->json('id') !== $actor->id) {
            Log::warning('Supabase rejected a Backroom password change.', [
                'user_id' => $actor->id,
                'status' => $response->status(),
            ]);
            abort(502, 'Unable to change the Backroom password.');
        }

        $updated = DB::table('profiles')
            ->where('id', $actor->id)
            ->where('must_change_password', true)
            ->update([
                'must_change_password' => false,
                'password_changed_at' => now(),
                'updated_at' => now(),
            ]);
        abort_unless($updated, 409, 'Password change could not be recorded.');

        return response()->json(['ok' => true]);
    }
}
