<?php

namespace App\Http\Middleware;

use App\Support\ApiRequestConsoleLogger;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class RequestTelemetry
{
    public function __construct(
        private readonly ApiRequestConsoleLogger $consoleLogger,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $this->requestId($request->header('X-Request-Id'));
        $request->attributes->set('request_id', $requestId);
        $startedAt = microtime(true);
        $request->attributes->set('request_started_at', $startedAt);
        $capturePerformance = config('app.performance_telemetry', false);

        if ($capturePerformance) {
            DB::flushQueryLog();
            DB::enableQueryLog();
        }

        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);

        $durationMs = round((microtime(true) - $startedAt) * 1000, 2);

        Log::channel('single')->info('HTTP request completed', [
            'request_id' => $requestId,
            'method' => $request->method(),
            'path' => '/'.ltrim($request->path(), '/'),
            'status' => $response->getStatusCode(),
            'duration_ms' => $durationMs,
            'actor_id' => $request->attributes->get('actor')?->id,
        ]);

        if ($this->consoleLogger->isApiRequest($request)) {
            $this->consoleLogger->log($request, $response->getStatusCode(), $durationMs);
        }

        if ($capturePerformance) {
            $queries = array_map(static fn (array $query): array => [
                'sql' => $query['query'],
                'duration_ms' => round((float) $query['time'], 2),
            ], DB::getQueryLog());
            DB::disableQueryLog();
            $slowest = collect($queries)->sortByDesc('duration_ms')->first();

            Log::channel('single')->info('HTTP request performance', [
                'request_id' => $requestId,
                'method' => $request->method(),
                'path' => '/'.ltrim($request->path(), '/'),
                'total_duration_ms' => $durationMs,
                'sql_query_count' => count($queries),
                'sql_duration_ms' => round(array_sum(array_column($queries, 'duration_ms')), 2),
                'slowest_sql' => $slowest,
                'sql_queries' => $queries,
            ]);
        }

        return $response;
    }

    private function requestId(?string $incoming): string
    {
        return is_string($incoming) && preg_match('/^[A-Za-z0-9._:-]{1,128}$/', $incoming) === 1
            ? $incoming
            : (string) Str::uuid();
    }
}
