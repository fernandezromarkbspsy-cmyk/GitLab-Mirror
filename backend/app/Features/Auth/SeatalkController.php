<?php

namespace App\Features\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SeatalkController
{
    private const TRANSACTION_TTL_MINUTES = 10;

    private const TOKEN_CACHE_KEY = 'seatalk:app-access-token';

    public function createLoginTransaction()
    {
        $appId = config('services.seatalk.app_id');
        $appSecret = config('services.seatalk.app_secret');
        $redirectUri = config('services.seatalk.redirect_uri');

        if (! $appId || ! $appSecret || ! $redirectUri) {
            return response()->json(['error' => 'not_configured', 'message' => 'SeaTalk login is not configured.'], 503);
        }

        try {
            $this->frontendOrigin($redirectUri);
        } catch (\InvalidArgumentException) {
            return response()->json(['error' => 'invalid_configuration', 'message' => 'SeaTalk login redirect URI is invalid.'], 503);
        }

        $transactionId = (string) Str::uuid();
        $state = Str::random(64);
        $pollToken = Str::random(64);
        $expiresAt = now()->addMinutes(self::TRANSACTION_TTL_MINUTES);

        Cache::put($this->transactionKey($transactionId), [
            'state_hash' => hash('sha256', $state),
            'poll_token_hash' => hash('sha256', $pollToken),
            'status' => 'pending',
        ], $expiresAt);
        Cache::put($this->stateKey($state), $transactionId, $expiresAt);

        $loginUrl = sprintf(
            'https://open.seatalk.io/web/authorize?app_id=%s&redirect_uri=%s&scope=open_login:employee&state=%s',
            rawurlencode($appId),
            rawurlencode($redirectUri),
            rawurlencode($state)
        );

        return response()->json([
            'success' => true,
            'login_url' => $loginUrl,
            'transaction_id' => $transactionId,
            'transaction_token' => $pollToken,
        ]);
    }

    public function callback(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string',
            'state' => 'required|string|size:64',
        ]);

        $transactionId = Cache::get($this->stateKey($data['state']));
        $transaction = is_string($transactionId) ? Cache::get($this->transactionKey($transactionId)) : null;

        if (! is_array($transaction) || ! hash_equals($transaction['state_hash'] ?? '', hash('sha256', $data['state']))) {
            return $this->callbackPage('invalid');
        }

        Cache::forget($this->stateKey($data['state']));

        try {
            $employee = $this->exchangeCodeForEmployee($data['code']);
            if (! $employee || ! is_string($employee['email'] ?? null) || ! str_ends_with(strtolower($employee['email']), '@spxexpress.com')) {
                throw new \RuntimeException('SeaTalk account is not eligible for FTE login.');
            }

            $transaction['status'] = 'complete';
            $transaction['employee'] = $employee;
            $transaction['session_url'] = $this->createSupabaseMagicLink($employee);
            Cache::put($this->transactionKey($transactionId), $transaction, now()->addMinutes(self::TRANSACTION_TTL_MINUTES));

            return $this->callbackPage('complete', $transactionId);
        } catch (\Throwable $exception) {
            Log::warning('SeaTalk login callback failed', [
                'transaction_id' => $transactionId,
                'error' => $exception->getMessage(),
            ]);

            $transaction['status'] = 'failed';
            Cache::put($this->transactionKey($transactionId), $transaction, now()->addMinute());

            return $this->callbackPage('failed', $transactionId);
        }
    }

    public function transactionStatus(Request $request, string $transactionId)
    {
        $token = $request->header('X-Seatalk-Transaction');
        $transaction = Cache::get($this->transactionKey($transactionId));

        if (! is_string($token) || ! is_array($transaction) || ! hash_equals($transaction['poll_token_hash'] ?? '', hash('sha256', $token))) {
            return response()->json(['message' => 'Login transaction was not found.'], 404);
        }

        if (($transaction['status'] ?? 'pending') === 'complete') {
            Cache::forget($this->transactionKey($transactionId));

            return response()->json([
                'status' => 'complete',
                'employee' => $transaction['employee'],
                'session_url' => $transaction['session_url'] ?? null,
            ]);
        }

        return response()->json([
            'status' => $transaction['status'] ?? 'pending',
            'message' => ($transaction['status'] ?? 'pending') === 'failed' ? 'SeaTalk could not verify this login. Please try again.' : null,
        ]);
    }

    private function exchangeCodeForEmployee(string $code): ?array
    {
        $employeeResponse = Http::timeout(10)
            ->retry(2, 100)
            ->withToken($this->appAccessToken())
            ->get('https://openapi.seatalk.io/open_login/code2employee', ['code' => $code]);

        if (! $employeeResponse->successful()) {
            throw new \RuntimeException('SeaTalk employee exchange request failed.');
        }

        $employeeData = $employeeResponse->json();
        if ((int) ($employeeData['code'] ?? -1) !== 0) {
            return null;
        }

        return is_array($employeeData['employee'] ?? null) ? $employeeData['employee'] : null;
    }

    private function appAccessToken(): string
    {
        $cachedToken = Cache::get(self::TOKEN_CACHE_KEY);
        if (is_string($cachedToken) && $cachedToken !== '') {
            return $cachedToken;
        }

        $tokenResponse = Http::timeout(10)
            ->retry(2, 100)
            ->post('https://openapi.seatalk.io/auth/app_access_token', [
                'app_id' => config('services.seatalk.app_id'),
                'app_secret' => config('services.seatalk.app_secret'),
            ]);

        if (! $tokenResponse->successful()) {
            throw new \RuntimeException('SeaTalk access-token request failed.');
        }

        $tokenData = $tokenResponse->json();
        $accessToken = $tokenData['app_access_token'] ?? null;
        if ((int) ($tokenData['code'] ?? -1) !== 0 || ! is_string($accessToken) || $accessToken === '') {
            throw new \RuntimeException('SeaTalk access-token response was invalid.');
        }

        $expiresInSeconds = max(60, (int) ($tokenData['expire'] ?? (now()->timestamp + 7200)) - now()->timestamp - 60);
        Cache::put(self::TOKEN_CACHE_KEY, $accessToken, now()->addSeconds($expiresInSeconds));

        return $accessToken;
    }

    private function createSupabaseMagicLink(array $employee): string
    {
        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $serviceKey = (string) config('services.supabase.service_key');
        $email = (string) ($employee['email'] ?? '');

        if ($supabaseUrl === '' || $serviceKey === '' || $email === '') {
            throw new \RuntimeException('Supabase session handoff is not configured.');
        }

        $response = Http::withHeaders(['apikey' => $serviceKey])
            ->withToken($serviceKey)
            ->withOptions(['proxy' => config('services.supabase.http_proxy') ?: false])
            ->withOptions(['verify' => config('services.supabase.ca_bundle') ?: true])
            ->connectTimeout(5)
            ->timeout(10)
            ->post($supabaseUrl.'/auth/v1/admin/generate_link', [
                'type' => 'magiclink',
                'email' => $email,
                'redirect_to' => $this->frontendOrigin((string) config('services.seatalk.redirect_uri')).'/',
                'data' => [
                    'seatalk_id' => $employee['employee_code'] ?? null,
                    'avatar_url' => $employee['avatar'] ?? null,
                    'mobile' => $employee['mobile'] ?? null,
                    'name' => $employee['name'] ?? null,
                ],
            ]);

        $actionLink = $response->json('action_link');
        if (! $response->successful() || ! is_string($actionLink) || $actionLink === '') {
            throw new \RuntimeException('Supabase session handoff failed.');
        }

        return $actionLink;
    }

    private function callbackPage(string $status, ?string $transactionId = null)
    {
        $origin = $this->frontendOrigin((string) config('services.seatalk.redirect_uri'));
        $payload = json_encode(['type' => 'seatalk_callback', 'status' => $status, 'transactionId' => $transactionId], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
        $originJson = json_encode($origin, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);

        return response("<!doctype html><title>SeaTalk Login</title><script>window.opener?.postMessage({$payload}, {$originJson});window.close();</script><p>SeaTalk login {$status}. You may close this window.</p>")
            ->header('Content-Type', 'text/html; charset=UTF-8');
    }

    private function frontendOrigin(string $redirectUri): string
    {
        $parts = parse_url($redirectUri);
        if (! is_array($parts) || ! isset($parts['scheme'], $parts['host']) || ! in_array($parts['scheme'], ['http', 'https'], true)) {
            throw new \InvalidArgumentException('Invalid SeaTalk redirect URI.');
        }

        return $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');
    }

    private function transactionKey(string $transactionId): string
    {
        return 'seatalk:login:'.$transactionId;
    }

    private function stateKey(string $state): string
    {
        return 'seatalk:state:'.hash('sha256', $state);
    }
}
