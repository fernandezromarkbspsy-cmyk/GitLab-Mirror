<?php

namespace App\Integrations\SeaTalk;

use Illuminate\Support\Facades\Http;
use Throwable;

final class SeaTalkClient
{
    public function __construct(private SeaTalkTokenProvider $tokens) {}

    public function request(string $method, string $path, array $payload): SeaTalkResponse
    {
        if ($path === '' || ! str_starts_with($path, '/')) {
            throw SeaTalkProviderException::contract('SeaTalk Approval Center endpoint path is not configured or is invalid.');
        }

        $baseUrl = rtrim((string) config('services.seatalk.approval.base_url'), '/');
        if ($baseUrl === '') {
            throw SeaTalkProviderException::contract('SeaTalk Approval Center base URL is not configured.');
        }

        try {
            $request = Http::withToken($this->tokens->token())
                ->asJson()
                ->acceptJson()
                ->connectTimeout((int) config('services.seatalk.approval.connect_timeout', 5))
                ->timeout((int) config('services.seatalk.approval.timeout', 10));
            $response = $request->{strtolower($method)}($baseUrl.$path, $payload);
        } catch (Throwable $exception) {
            if ($exception instanceof SeaTalkProviderException) {
                throw $exception;
            }

            throw new SeaTalkProviderException('Unable to reach SeaTalk Approval Center.', SeaTalkProviderException::TRANSIENT, 0, $exception);
        }

        if (! $response->successful()) {
            throw new SeaTalkProviderException(
                'SeaTalk Approval Center rejected the request.',
                $this->categoryForStatus($response->status()),
                $response->status(),
            );
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            throw new SeaTalkProviderException('SeaTalk Approval Center returned an invalid response.', SeaTalkProviderException::TRANSIENT, $response->status());
        }
        if (array_key_exists('code', $payload) && (int) $payload['code'] !== 0) {
            throw new SeaTalkProviderException('SeaTalk Approval Center returned a provider error.', SeaTalkProviderException::VALIDATION, $response->status());
        }

        return new SeaTalkResponse($response->status(), $payload, $response->headers());
    }

    private function categoryForStatus(int $status): string
    {
        return match (true) {
            $status === 401 => SeaTalkProviderException::AUTHENTICATION,
            $status === 403 => SeaTalkProviderException::PERMISSION,
            $status === 409, $status === 422 => SeaTalkProviderException::VALIDATION,
            $status === 429 => SeaTalkProviderException::RATE_LIMIT,
            $status >= 500 => SeaTalkProviderException::TRANSIENT,
            default => SeaTalkProviderException::VALIDATION,
        };
    }
}
