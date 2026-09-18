<?php

namespace Tests\Feature;

use Tests\TestCase;

final class AuthStatusTest extends TestCase
{
    public function test_auth_status_is_ready_when_supabase_is_configured(): void
    {
        config()->set([
            'services.auth.provider' => 'supabase',
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
            'services.auth.provider' => 'supabase',
            'services.supabase.url' => null,
            'services.supabase.anon_key' => null,
        ]);

        $this->getJson('/api/auth/status')
            ->assertServiceUnavailable()
            ->assertJsonPath('message', 'Authentication service is not configured.');
    }

    public function test_auth_status_uses_appwrite_configuration_when_appwrite_is_selected(): void
    {
        config()->set([
            'services.auth.provider' => 'appwrite',
            'services.appwrite.endpoint' => 'https://sgp.cloud.appwrite.io/v1',
            'services.appwrite.project_id' => 'project-test',
            'services.appwrite.api_key' => 'server-key-test',
            'services.appwrite.database_id' => 'soc5_outbound',
        ]);

        $this->getJson('/api/auth/status')
            ->assertOk()
            ->assertExactJson(['configured' => true]);
    }

    public function test_auth_status_fails_when_appwrite_is_selected_without_server_configuration(): void
    {
        config()->set([
            'services.auth.provider' => 'appwrite',
            'services.appwrite.endpoint' => null,
            'services.appwrite.project_id' => null,
            'services.appwrite.api_key' => null,
            'services.appwrite.database_id' => null,
        ]);

        $this->getJson('/api/auth/status')
            ->assertServiceUnavailable()
            ->assertJsonPath('message', 'Authentication service is not configured.');
    }
}
