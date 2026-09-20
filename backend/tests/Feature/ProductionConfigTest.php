<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class ProductionConfigTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_production_config_rejects_debug_mode(): void
    {
        Schema::shouldReceive('hasTable')->with('user_events')->andReturnTrue();
        Schema::shouldReceive('hasTable')->with('idempotency_keys')->andReturnTrue();
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
        Schema::shouldReceive('hasTable')->with('user_events')->andReturnTrue();
        Schema::shouldReceive('hasTable')->with('idempotency_keys')->andReturnTrue();

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

    public function test_production_config_fails_when_a_required_table_is_missing(): void
    {
        Schema::shouldReceive('hasTable')->with('user_events')->andReturnFalse();
        Schema::shouldReceive('hasTable')->with('idempotency_keys')->andReturnTrue();

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

        $this->artisan('system:verify-config', ['--production' => true])->assertExitCode(1);
    }
}
