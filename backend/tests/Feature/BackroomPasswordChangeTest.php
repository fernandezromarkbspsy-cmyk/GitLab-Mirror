<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use PDO;
use Tests\TestCase;

final class BackroomPasswordChangeTest extends TestCase
{
    private string $userId;

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for Backroom password change tests.');
        }

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        config()->set('services.supabase', [
            'url' => 'https://test-project.supabase.co',
            'anon_key' => 'test-anon-key',
            'service_key' => 'test-service-key',
            'http_proxy' => '',
            'ca_bundle' => '',
            'connect_timeout' => 5,
            'timeout' => 10,
            'token_cache_ttl' => 0,
        ]);
        Cache::flush();
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('role');
            $table->string('email')->nullable();
            $table->string('ops_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('must_change_password')->default(false);
            $table->timestamp('password_reset_at')->nullable();
            $table->timestamp('password_changed_at')->nullable();
            $table->timestamps();
        });

        $this->userId = (string) Str::uuid();
        DB::table('profiles')->insert([
            'id' => $this->userId,
            'name' => 'Backroom User',
            'role' => 'ops_pic',
            'ops_id' => 'ops123',
            'is_active' => true,
            'must_change_password' => true,
            'password_reset_at' => now()->subMinute(),
            'created_at' => now()->subDay(),
            'updated_at' => now()->subMinute(),
        ]);
    }

    public function test_completion_cannot_be_cleared_without_a_password_update(): void
    {
        $this->fakeSupabase();

        $this->postJson('/api/auth/password-changed', [], $this->headers())
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');

        $this->assertTrue((bool) DB::table('profiles')->where('id', $this->userId)->value('must_change_password'));
        Http::assertNotSent(fn ($request) => $request->method() === 'PUT');
    }

    public function test_successful_supabase_update_completes_password_change(): void
    {
        $this->fakeSupabase();

        $this->postJson('/api/auth/password-changed', [
            'password' => 'a-strong-new-password',
        ], $this->headers())->assertOk()->assertExactJson(['ok' => true]);

        $profile = DB::table('profiles')->where('id', $this->userId)->first();
        $this->assertFalse((bool) $profile->must_change_password);
        $this->assertNotNull($profile->password_changed_at);
        Http::assertSent(fn ($request) => $request->method() === 'PUT'
            && $request->url() === 'https://test-project.supabase.co/auth/v1/user'
            && $request['password'] === 'a-strong-new-password');
    }

    public function test_supabase_failure_keeps_password_change_required(): void
    {
        $this->fakeSupabase(false);

        $this->postJson('/api/auth/password-changed', [
            'password' => 'a-strong-new-password',
        ], $this->headers())->assertStatus(502);

        $this->assertTrue((bool) DB::table('profiles')->where('id', $this->userId)->value('must_change_password'));
    }

    private function fakeSupabase(bool $passwordUpdateSucceeds = true): void
    {
        Http::fake(function ($request) use ($passwordUpdateSucceeds) {
            if ($request->method() === 'PUT') {
                return $passwordUpdateSucceeds
                    ? Http::response(['id' => $this->userId, 'updated_at' => now()->toIso8601String()])
                    : Http::response(['error' => 'unavailable'], 503);
            }

            return Http::response(['id' => $this->userId, 'updated_at' => now()->subMinute()->toIso8601String()]);
        });
    }

    private function headers(): array
    {
        return ['Authorization' => 'Bearer test-backroom-token'];
    }
}
