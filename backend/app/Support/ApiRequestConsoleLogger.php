<?php

namespace App\Support;

use DateTimeInterface;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Symfony\Component\HttpFoundation\Response;

final class ApiRequestConsoleLogger
{
    public function isApiRequest(Request $request): bool
    {
        return $request->is('api', 'api/*');
    }

    public function log(Request $request, int $statusCode, float $durationMs): void
    {
        if ($request->attributes->get('api_console_logged', false)) {
            return;
        }

        $request->attributes->set('api_console_logged', true);
        file_put_contents('php://stderr', $this->format($request, $statusCode, $durationMs).PHP_EOL);
    }

    public function format(
        Request $request,
        int $statusCode,
        float $durationMs,
        ?DateTimeInterface $timestamp = null,
    ): string {
        $timestamp ??= now();
        $method = $request->method();
        $endpoint = $this->endpoint($request);
        $prefix = ' '.$timestamp->format('H:i:s').'  '.str_pad($method, 4).' ';
        $icon = $this->icon($statusCode, $durationMs);
        $duration = $this->formatDuration($durationMs);
        $status = $this->statusText($statusCode);
        $message = $this->message($statusCode, $durationMs);

        return $icon.$prefix.$endpoint.PHP_EOL
            .str_repeat(' ', mb_strwidth($icon.$prefix, 'UTF-8'))
            .$statusCode.' '.$status.' • '.$duration.' • '.$message;
    }

    private function endpoint(Request $request): string
    {
        $route = $request->route();

        return $route instanceof Route
            ? '/'.ltrim($route->uri(), '/')
            : '/api/<unmatched>';
    }

    private function icon(int $statusCode, float $durationMs): string
    {
        return match (true) {
            in_array($statusCode, [401, 403], true) => '🟣',
            $statusCode >= 400 => '🔴',
            $durationMs >= 1000 => '🟠',
            $durationMs >= 420 => '🟡',
            default => '🟢',
        };
    }

    private function statusText(int $statusCode): string
    {
        if ($statusCode >= 500) {
            return 'ERROR';
        }

        return strtoupper(Response::$statusTexts[$statusCode] ?? 'UNKNOWN');
    }

    private function message(int $statusCode, float $durationMs): string
    {
        return match (true) {
            $statusCode === 401 => 'Authentication failed',
            $statusCode === 403 => 'Authorization failed',
            $statusCode >= 400 => 'Request failed',
            $durationMs >= 1000 => 'Performance warning',
            $durationMs >= 420 => 'Slow response',
            default => 'Request successful',
        };
    }

    private function formatDuration(float $durationMs): string
    {
        if ($durationMs < 1000) {
            return rtrim(rtrim(number_format(max(0, $durationMs), 2, '.', ''), '0'), '.').'ms';
        }

        return rtrim(rtrim(number_format($durationMs / 1000, 2, '.', ''), '0'), '.').'s';
    }
}
