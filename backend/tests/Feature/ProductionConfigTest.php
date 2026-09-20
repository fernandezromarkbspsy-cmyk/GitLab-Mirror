<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class ProductionConfigTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Schema::shouldReceive('hasTable')->andReturnTrue();
    }

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
}
