<?php

namespace Tests\Feature;

use App\Support\ApiRequestConsoleLogger;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;
use Tests\TestCase;

final class RequestTelemetryTest extends TestCase
{
    public function test_request_id_is_propagated(): void
    {
        $this->get('/up', ['X-Request-Id' => 'phase1-test-request'])
            ->assertOk()
            ->assertHeader('X-Request-Id', 'phase1-test-request');
    }

    public function test_api_console_log_uses_a_two_line_structured_format(): void
    {
        $request = Request::create('/api/v1/requests/analytics', 'GET');
        $request->setRouteResolver(fn (): Route => new Route('GET', 'api/v1/requests/analytics', []));

        $formatted = app(ApiRequestConsoleLogger::class)->format(
            $request,
            200,
            420,
            new \DateTimeImmutable('2026-10-04 20:43:02'),
        );
        [$firstLine, $secondLine] = explode(PHP_EOL, $formatted);

        $this->assertSame('🟡 20:43:02  GET  /api/v1/requests/analytics', $firstLine);
        $this->assertSame(
            str_repeat(' ', mb_strwidth('🟡 20:43:02  GET  ', 'UTF-8')).'200 OK • 420ms • Slow response',
            $secondLine,
        );
    }

    public function test_normal_successful_requests_use_success_severity(): void
    {
        $request = Request::create('/api/v1/requests', 'GET');
        $request->setRouteResolver(fn (): Route => new Route('GET', 'api/v1/requests', []));

        $formatted = app(ApiRequestConsoleLogger::class)->format(
            $request,
            200,
            84,
            new \DateTimeImmutable('2026-10-04 20:43:01'),
        );

        $this->assertStringContainsString('🟢 20:43:01  GET  /api/v1/requests', $formatted);
        $this->assertStringContainsString('200 OK • 84ms • Request successful', $formatted);
    }

    public function test_api_console_log_omits_request_data_and_uses_seconds_for_slow_requests(): void
    {
        $request = Request::create('/api/v1/auth/login?email=private@example.test', 'POST', [
            'password' => 'not-for-logs',
        ]);
        $request->headers->set('Authorization', 'Bearer sensitive-token');
        $request->setRouteResolver(fn (): Route => new Route('POST', 'api/v1/auth/login', []));

        $formatted = app(ApiRequestConsoleLogger::class)->format(
            $request,
            401,
            1240,
            new \DateTimeImmutable('2026-10-04 20:43:05'),
        );

        $this->assertStringContainsString('🟣 20:43:05  POST /api/v1/auth/login', $formatted);
        $this->assertStringContainsString('401 UNAUTHORIZED • 1.24s • Authentication failed', $formatted);
        $this->assertStringNotContainsString('private@example.test', $formatted);
        $this->assertStringNotContainsString('not-for-logs', $formatted);
        $this->assertStringNotContainsString('sensitive-token', $formatted);
        $this->assertStringNotContainsString('Bearer', $formatted);
    }

    public function test_server_errors_use_the_error_severity_and_generic_message(): void
    {
        $request = Request::create('/api/v1/requests', 'POST');
        $request->setRouteResolver(fn (): Route => new Route('POST', 'api/v1/requests', []));

        $formatted = app(ApiRequestConsoleLogger::class)->format(
            $request,
            500,
            183,
            new \DateTimeImmutable('2026-10-04 20:43:07'),
        );

        $this->assertStringContainsString('🔴 20:43:07  POST /api/v1/requests', $formatted);
        $this->assertStringContainsString('500 ERROR • 183ms • Request failed', $formatted);
    }

    public function test_significantly_slow_successful_requests_use_performance_severity(): void
    {
        $request = Request::create('/api/v1/dispatch/intraday', 'GET');
        $request->setRouteResolver(fn (): Route => new Route('GET', 'api/v1/dispatch/intraday', []));

        $formatted = app(ApiRequestConsoleLogger::class)->format(
            $request,
            200,
            1240,
            new \DateTimeImmutable('2026-10-04 20:43:03'),
        );

        $this->assertStringContainsString('🟠 20:43:03  GET  /api/v1/dispatch/intraday', $formatted);
        $this->assertStringContainsString('200 OK • 1.24s • Performance warning', $formatted);
    }

    public function test_api_exceptions_keep_the_existing_error_response(): void
    {
        RouteFacade::get('/api/v1/request-telemetry-error', static function (): never {
            throw new \RuntimeException('Private diagnostic detail');
        });

        $this->getJson('/api/v1/request-telemetry-error')
            ->assertStatus(500);
    }
}
