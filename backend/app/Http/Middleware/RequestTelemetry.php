<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class RequestTelemetry
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $this->requestId($request->header('X-Request-Id'));
        $request->attributes->set('request_id', $requestId);
        $startedAt = microtime(true);

        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);

        Log::info('HTTP request completed', [
            'request_id' => $requestId,
            'method' => $request->method(),
            'path' => '/'.ltrim($request->path(), '/'),
            'status' => $response->getStatusCode(),
            'duration_ms' => round((microtime(true) - $startedAt) * 1000, 2),
            'actor_id' => $request->attributes->get('actor')?->id,
        ]);

        return $response;
    }

    private function requestId(?string $incoming): string
    {
        return is_string($incoming) && preg_match('/^[A-Za-z0-9._:-]{1,128}$/', $incoming) === 1
            ? $incoming
            : (string) Str::uuid();
    }
}