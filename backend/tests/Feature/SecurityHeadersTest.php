<?php

namespace Tests\Feature;

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Http\Request;
use Tests\TestCase;

final class SecurityHeadersTest extends TestCase
{
    public function test_api_responses_include_baseline_security_headers(): void
    {
        $response = $this->getJson('/api/auth/status');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        $response->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    }

    public function test_cors_preflight_allows_only_the_configured_frontend_origin(): void
    {
        config()->set('cors.allowed_origins', ['https://frontend.example.test']);

        $response = $this->call('OPTIONS', '/api/auth/status', [], [], [], [
            'HTTP_ORIGIN' => 'https://frontend.example.test',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'Authorization, Content-Type',
        ]);

        $response->assertNoContent();
        $response->assertHeader('Access-Control-Allow-Origin', 'https://frontend.example.test');
        $response->assertHeader('Access-Control-Allow-Credentials', 'true');

        $blocked = $this->call('OPTIONS', '/api/auth/status', [], [], [], [
            'HTTP_ORIGIN' => 'https://attacker.example.test',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
        ]);

        $this->assertSame(
            'https://frontend.example.test',
            $blocked->headers->get('Access-Control-Allow-Origin'),
        );
    }

    public function test_secure_api_responses_include_hsts(): void
    {
        $request = Request::create('https://api.example.test/api/auth/status');
        $response = (new SecurityHeaders)->handle(
            $request,
            fn () => response()->json(['ok' => true]),
        );

        $this->assertSame(
            'max-age=31536000; includeSubDomains',
            $response->headers->get('Strict-Transport-Security'),
        );
    }
}
