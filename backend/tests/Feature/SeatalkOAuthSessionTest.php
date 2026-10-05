<?php

namespace Tests\Feature;

use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Http\Request;
use Tests\TestCase;

final class SeatalkOAuthSessionTest extends TestCase
{
    public function test_authenticated_api_routes_decrypt_the_seatalk_session_cookie_and_check_origin(): void
    {
        $route = app('router')->getRoutes()->match(Request::create('/api/v1/users', 'GET'));

        $this->assertContains(EncryptCookies::class, $route->gatherMiddleware());
        $this->assertContains(AddQueuedCookiesToResponse::class, $route->gatherMiddleware());
        $this->assertContains('session.origin', $route->gatherMiddleware());
    }

    public function test_seatalk_session_mutations_reject_cross_origin_requests(): void
    {
        $this->withSession(['seatalk_profile_id' => 'session-user-id'])
            ->withHeader('Origin', 'https://attacker.example')
            ->postJson('/api/v1/auth/seatalk/logout')
            ->assertForbidden();
    }

    public function test_seatalk_session_mutations_allow_same_origin_requests(): void
    {
        $this->withSession(['seatalk_profile_id' => 'session-user-id'])
            ->withHeader('Origin', 'http://localhost')
            ->postJson('/api/v1/auth/seatalk/logout')
            ->assertOk()
            ->assertJsonPath('ok', true);
    }

    public function test_seatalk_session_mutations_allow_the_configured_frontend_origin(): void
    {
        $this->withSession(['seatalk_profile_id' => 'session-user-id'])
            ->withHeader('Origin', config('app.frontend_url'))
            ->postJson('/api/v1/auth/seatalk/logout')
            ->assertOk()
            ->assertJsonPath('ok', true);
    }

    public function test_seatalk_state_survives_from_config_request_to_callback(): void
    {
        $route = app('router')->getRoutes()->match(Request::create('/api/v1/auth/seatalk/config', 'GET'));

        $this->assertContains(EncryptCookies::class, $route->gatherMiddleware());
        $this->assertContains(AddQueuedCookiesToResponse::class, $route->gatherMiddleware());

        config()->set('app.frontend_url', 'https://frontend.test');
        config()->set('services.seatalk', [
            'app_id' => 'test-app',
            'app_secret' => 'test-secret',
            'redirect_uri' => 'https://frontend.test/auth/seatalk/callback',
            'sdk_url' => 'https://example.test/seatalk.js',
            'token_url' => 'https://example.test/token',
            'user_url' => 'https://example.test/user',
            'connect_timeout' => 5,
            'timeout' => 10,
        ]);

        $configResponse = $this->getJson('/api/v1/auth/seatalk/config');
        $configResponse->assertOk();

        $state = $configResponse->json('state');
        $this->assertIsString($state);
        $this->assertNotSame('', $state);

        $this->get('/auth/seatalk/callback?state='.urlencode($state))
            ->assertRedirect('https://frontend.test/?seatalk=error&reason=missing_code');
    }
}
