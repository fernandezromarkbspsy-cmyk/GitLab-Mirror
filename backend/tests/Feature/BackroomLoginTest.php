<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

final class BackroomLoginTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for isolated Backroom login tests.');
        }
        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('role');
            $table->boolean('is_active')->default(true);
            $table->string('ops_id')->nullable();
            $table->boolean('must_change_password')->default(true);
            $table->timestamps();
        });
        config()->set('services.supabase', [
            'url' => 'https://test-project.supabase.co',
            'anon_key' => 'test-anon-key',
            'service_key' => 'test-service-key',
            'http_proxy' => '',
            'ca_bundle' => '',
        ]);
    }

    private function insertProfile(array $overrides = []): string
    {
        $id = (string) Str::uuid();
        DB::table('profiles')->insert(array_merge([
            'id' => $id,
            'role' => 'ops_pic',
            'is_active' => true,
            'ops_id' => 'ops123',
            'must_change_password' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));

        return $id;
    }

    public function test_first_login_rejects_wrong_password_without_resetting_the_account(): void
    {
        $this->insertProfile();
        Http::fake([
            'https://test-project.supabase.co/auth/v1/token*' => Http::response(['error' => 'invalid_grant'], 400),
        ]);

        $this->postJson('/api/auth/backroom/login', [
            'ops_id' => 'ops123',
            'password' => 'guessed-password',
            'mode' => 'first-login',
        ])->assertStatus(401);

        Http::assertNotSent(fn ($request) => str_contains($request->url(), '/auth/v1/admin/users/'));
    }

    public function test_first_login_succeeds_with_the_correct_password(): void
    {
        $this->insertProfile();
        Http::fake([
            'https://test-project.supabase.co/auth/v1/token*' => Http::response([
                'access_token' => 'test-access-token',
                'refresh_token' => 'test-refresh-token',
            ]),
        ]);

        $this->postJson('/api/auth/backroom/login', [
            'ops_id' => 'ops123',
            'password' => 'correct-password',
            'mode' => 'first-login',
        ])->assertOk()->assertJsonPath('access_token', 'test-access-token');
    }

    public function test_first_login_is_rejected_once_the_account_has_already_completed_it(): void
    {
        $this->insertProfile(['must_change_password' => false]);
        Http::fake();

        $this->postJson('/api/auth/backroom/login', [
            'ops_id' => 'ops123',
            'password' => 'anything',
            'mode' => 'first-login',
        ])->assertStatus(409);

        Http::assertNothingSent();
    }

    public function test_repeated_attempts_for_the_same_ops_id_are_rate_limited(): void
    {
        $this->insertProfile();
        Http::fake([
            'https://test-project.supabase.co/auth/v1/token*' => Http::response(['error' => 'invalid_grant'], 400),
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/backroom/login', [
                'ops_id' => 'ops123',
                'password' => 'guessed-'.$i,
                'mode' => 'first-login',
            ])->assertStatus(401);
        }

        $this->postJson('/api/auth/backroom/login', [
            'ops_id' => 'ops123',
            'password' => 'guessed-6',
            'mode' => 'first-login',
        ])->assertStatus(429);
    }
}
