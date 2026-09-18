<?php

namespace Tests\Feature;

use Tests\TestCase;

final class AuthStatusTest extends TestCase
{
    public function test_auth_status_is_ready_when_supabase_is_configured(): void
    {
        config()->set([
            'services.supabase.url' => 'https://project.supabase.co',
            'services.supabase.anon_key' => 'sb_publishable_test',
        ]);

        $this->getJson('/api/auth/status')
            ->assertOk()
            ->assertExactJson(['configured' => true]);
    }

    public function test_auth_status_fails_when_supabase_is_not_configured(): void
    {
        config()->set([
            'services.supabase.url' => null,
            'services.supabase.anon_key' => null,
        ]);

        $this->getJson('/api/auth/status')
            ->assertServiceUnavailable()
            ->assertJsonPath('message', 'Authentication service is not configured.');
    }
}
