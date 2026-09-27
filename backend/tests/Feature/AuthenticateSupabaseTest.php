<?php

namespace Tests\Feature;

use Tests\TestCase;

final class AuthenticateSupabaseTest extends TestCase
{
    public function test_missing_ca_bundle_returns_service_unavailable(): void
    {
        config()->set([
            'services.supabase.url' => 'https://project.supabase.co',
            'services.supabase.anon_key' => 'publishable-key',
            'services.supabase.ca_bundle' => '/missing/prod-ca.crt',
            'services.supabase.token_cache_ttl' => 0,
        ]);

        $this->withToken('test-token')
            ->getJson('/api/auth/me')
            ->assertServiceUnavailable()
            ->assertJsonPath('message', 'Authentication service TLS configuration is invalid.');
    }
}
