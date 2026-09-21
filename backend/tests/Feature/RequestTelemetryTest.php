<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Log;
use Tests\TestCase;

final class RequestTelemetryTest extends TestCase
{
    public function test_request_id_is_propagated_and_request_timing_is_logged(): void
    {
        Log::spy();

        $this->get('/up', ['X-Request-Id' => 'phase1-test-request'])
            ->assertOk()
            ->assertHeader('X-Request-Id', 'phase1-test-request');

        Log::shouldHaveReceived('info')
            ->once()
            ->withArgs(function (string $message, array $context): bool {
                return $message === 'HTTP request completed'
                    && $context['request_id'] === 'phase1-test-request'
                    && $context['method'] === 'GET'
                    && $context['path'] === '/up'
                    && $context['status'] === 200
                    && is_float($context['duration_ms'])
                    && $context['actor_id'] === null;
            });
    }
}
