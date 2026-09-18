<?php

namespace Tests\Feature;

use Tests\TestCase;

final class ProductionConfigTest extends TestCase
{
    public function test_production_config_rejects_debug_mode(): void
    {
        config()->set([
            'app.env' => 'production',
            'app.debug' => true,
            'app.key' => 'base64:test-key',
            'app.url' => 'https://api.example.test',
            'services.supabase.url' => 'https://project.supabase.co',
            'services.supabase.anon_key' => 'publishable-key',
            'services.supabase.service_key' => 'service-key',
            'services.admin_emails' => ['admin@example.test'],
            'database.connections.pgsql.host' => 'db.example.test',
            'database.connections.pgsql.username' => 'postgres',
            'database.connections.pgsql.password' => 'password',
            'database.connections.pgsql.sslmode' => 'require',
        ]);

        $this->artisan('system:verify-config', ['--production' => true])->assertExitCode(1);
    }

    public function test_production_config_accepts_secure_configuration(): void
    {
        config()->set([
            'app.env' => 'production',
            'app.debug' => false,
            'app.key' => 'base64:test-key',
            'app.url' => 'https://api.example.test',
            'services.supabase.url' => 'https://project.supabase.co',
            'services.supabase.anon_key' => 'publishable-key',
            'services.supabase.service_key' => 'service-key',
            'services.admin_emails' => ['admin@example.test'],
            'database.connections.pgsql.host' => 'db.example.test',
            'database.connections.pgsql.username' => 'postgres',
            'database.connections.pgsql.password' => 'password',
            'database.connections.pgsql.sslmode' => 'require',
        ]);

        $this->artisan('system:verify-config', ['--production' => true])->assertExitCode(0);
    }

    public function test_production_config_requires_appwrite_configuration_when_selected(): void
    {
        config()->set([
            'services.auth.provider' => 'appwrite',
            'app.env' => 'production', 'app.debug' => false, 'app.key' => 'base64:test-key',
            'app.url' => 'https://api.example.test',
            'services.admin_emails' => ['admin@example.test'],
            'database.connections.pgsql.host' => 'db.example.test',
            'database.connections.pgsql.username' => 'postgres',
            'database.connections.pgsql.password' => 'password',
            'database.connections.pgsql.sslmode' => 'require',
            'services.appwrite.endpoint' => 'http://appwrite.example.test/v1',
            'services.appwrite.project_id' => 'project-test',
            'services.appwrite.api_key' => 'server-key-test',
            'services.appwrite.database_id' => 'soc5_outbound',
            'services.appwrite.tables' => [
                'profiles' => 'profiles', 'sessions' => 'sessions',
                'audit_logs' => 'audit_logs', 'password_resets' => 'password_resets',
            ],
        ]);

        $this->artisan('system:verify-config', ['--production' => true])->assertExitCode(1);
    }
}
