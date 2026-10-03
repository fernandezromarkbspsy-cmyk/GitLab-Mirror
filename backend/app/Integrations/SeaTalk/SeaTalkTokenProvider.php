<?php

namespace App\Integrations\SeaTalk;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

final class SeaTalkTokenProvider
{
    public function token(): string
    {
        $appId = (string) config('services.seatalk.approval.app_id');
        $appSecret = (string) config('services.seatalk.approval.app_secret');
        if ($appId === '' || $appSecret === '') {
            throw new SeaTalkProviderException('SeaTalk Approval Center credentials are not configured.', SeaTalkProviderException::AUTHENTICATION);
        }

        $cacheKey = 'seatalk.approval.app-access-token.'.hash('sha256', $appId);
        $cached = Cache::get($cacheKey);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        try {
            $response = Http::asJson()
                ->acceptJson()
                ->connectTimeout((int) config('services.seatalk.approval.connect_timeout', 5))
                ->timeout((int) config('services.seatalk.approval.timeout', 10))
                ->post((string) config('services.seatalk.token_url'), [
                    'app_id' => $appId,
                    'app_secret' => $appSecret,
                ]);
        } catch (Throwable $exception) {
            throw new SeaTalkProviderException('Unable to reach SeaTalk token API.', SeaTalkProviderException::TRANSIENT, 0, $exception);
        }

        $token = $response->json('app_access_token');
        if (! $response->successful() || (int) $response->json('code') !== 0 || ! is_string($token) || $token === '') {
            $category = $response->status() === 429
                ? SeaTalkProviderException::RATE_LIMIT
                : ($response->status() >= 500 ? SeaTalkProviderException::TRANSIENT : SeaTalkProviderException::AUTHENTICATION);
            throw new SeaTalkProviderException('SeaTalk token API rejected the credentials.', $category, $response->status());
        }

        $expiresIn = max(1, (int) $response->json('expire_in', 3600) - 60);
        Cache::put($cacheKey, $token, now()->addSeconds($expiresIn));

        return $token;
    }
}
