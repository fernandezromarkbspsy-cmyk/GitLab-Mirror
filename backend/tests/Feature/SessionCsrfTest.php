<?php

namespace Tests\Feature;

use Tests\TestCase;

final class SessionCsrfTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('services.seatalk', [
            'app_id' => 'test-app',
            'app_secret' => 'test-secret',
            'redirect_uri' => 'https://frontend.test/auth/seatalk/callback',
            'sdk_url' => 'https://example.test/seatalk.js',
            'token_url' => 'https://example.test/token',
            'user_url' => 'https://example.test/user',
        ]);
    }

    public function test_public_config_issues_a_readable_token_cookie_before_authentication(): void
    {
        $response = $this->withSession(['seatalk_profile_id' => 'session-user'])
            ->getJson('/api/v1/auth/seatalk/config');

        $response->assertOk();
        $cookie = collect($response->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'XSRF-TOKEN');

        $this->assertNotNull($cookie);
        $this->assertSame('lax', $cookie->getSameSite());
        $this->assertSame($response->json('state') !== '', true);
        $this->assertStringNotContainsString('|', (string) $cookie->getValue());
    }

    public function test_cookie_authenticated_logout_requires_the_current_token_and_refreshes_it(): void
    {
        $bootstrap = $this->withSession(['seatalk_profile_id' => 'session-user'])
            ->getJson('/api/v1/auth/seatalk/config')
            ->assertOk();
        $cookie = collect($bootstrap->headers->getCookies())->first(fn ($candidate) => $candidate->getName() === 'XSRF-TOKEN');
        $this->assertNotNull($cookie);
        $token = rawurldecode((string) $cookie->getValue());

        $logout = $this->postJson('/api/v1/auth/seatalk/logout', [], ['X-XSRF-TOKEN' => $token]);
        $logout->assertOk();
        $newCookie = collect($logout->headers->getCookies())->first(fn ($candidate) => $candidate->getName() === 'XSRF-TOKEN');

        $this->assertNotNull($newCookie);
        $this->assertNotSame($token, rawurldecode((string) $newCookie->getValue()));
    }

    public function test_missing_and_tampered_tokens_are_rejected(): void
    {
        $this->withSession(['seatalk_profile_id' => 'session-user'])
            ->getJson('/api/v1/auth/seatalk/config')
            ->assertOk();

        $this->postJson('/api/v1/auth/seatalk/logout')->assertStatus(419);
        $this->postJson('/api/v1/auth/seatalk/logout', [], ['X-XSRF-TOKEN' => 'tampered'])->assertStatus(419);
    }
}
