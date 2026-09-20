<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

final class ProvisionBackroomUsersTest extends TestCase
{
    private string $authUserId;

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for provisioning tests.');
        }

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        config()->set('services.supabase.url', 'https://test-project.supabase.co');
        config()->set('services.supabase.service_key', 'test-service-key');
        config()->set('services.supabase.connect_timeout', 5);
        config()->set('services.supabase.timeout', 10);
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('role');
            $table->string('ops_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('must_change_password')->default(false);
            $table->timestamp('password_reset_at')->nullable();
            $table->timestamp('password_changed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('user_imports', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('role');
            $table->string('ops_id');
            $table->uuid('auth_user_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('imported_at')->nullable();
        });

        $this->authUserId = (string) Str::uuid();
        DB::table('profiles')->insert([
            'id' => $this->authUserId,
            'name' => 'Completed Backroom User',
            'role' => 'ops_pic',
            'ops_id' => 'ops123',
            'is_active' => true,
            'must_change_password' => false,
            'password_changed_at' => now()->subDay(),
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDay(),
        ]);
        DB::table('user_imports')->insert([
            'id' => (string) Str::uuid(),
            'name' => 'Completed Backroom User',
            'role' => 'ops_pic',
            'ops_id' => 'OPS123',
            'auth_user_id' => $this->authUserId,
            'is_active' => true,
            'imported_at' => now()->subDay(),
        ]);
    }

    public function test_all_preserves_completed_accounts_without_resetting_passwords(): void
    {
        Http::fake();

        $this->artisan('users:provision-backroom', ['--all' => true])->assertExitCode(0);

        $this->assertFalse((bool) DB::table('profiles')->where('id', $this->authUserId)->value('must_change_password'));
        Http::assertNothingSent();
    }

    public function test_all_keeps_completed_accounts_without_repairing_passwords(): void
    {
        Http::fake();

        $this->artisan('users:provision-backroom', ['--all' => true])->assertExitCode(0);

        $this->assertFalse((bool) DB::table('profiles')->where('id', $this->authUserId)->value('must_change_password'));
        Http::assertNothingSent();
    }
}
