<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

final class IdempotencyTest extends TestCase
{
    private string $actorOne;

    private string $actorTwo;

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for isolated idempotency tests.');
        }

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        config()->set('services.supabase', [
            'url' => 'https://test-project.supabase.co',
            'anon_key' => 'test-anon-key',
            'service_key' => 'test-service-key',
            'http_proxy' => '',
            'ca_bundle' => '',
            'token_cache_ttl' => 0,
        ]);
        config()->set('services.supabase.token_cache_ttl', 0);
        Cache::flush();
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        $this->actorOne = (string) Str::uuid();
        $this->actorTwo = (string) Str::uuid();
        $this->createSchema();
        $this->insertActor($this->actorOne, 'actor-one@example.test');
        $this->insertActor($this->actorTwo, 'actor-two@example.test');

        Http::fake(function ($request) {
            $authorization = implode(',', (array) $request->header('Authorization'));
            $actorId = str_contains($authorization, 'actor-two')
                ? $this->actorTwo
                : $this->actorOne;

            return Http::response(['id' => $actorId, 'updated_at' => '2026-09-19T00:00:00Z']);
        });
    }

    public function test_first_request_is_replayed_without_duplicate_side_effects(): void
    {
        $data = $this->requestData();

        $first = $this->postJson('/api/requests', $data, $this->headers('create-key'))->assertCreated();
        $second = $this->postJson('/api/requests', $data, $this->headers('create-key'))->assertCreated();

        $this->assertSame($first->json(), $second->json());
        $this->assertDatabaseCount('requests', 1);
        $this->assertDatabaseCount('request_events', 1);
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('idempotency_keys', [
            'actor_id' => $this->actorOne,
            'key' => 'create-key',
            'response_status' => 201,
        ]);
    }

    public function test_same_key_with_different_payload_returns_conflict(): void
    {
        $this->postJson('/api/requests', $this->requestData(), $this->headers('conflict-key'))->assertCreated();

        $this->postJson('/api/requests', $this->requestData(['cluster' => 'SOC 6']), $this->headers('conflict-key'))
            ->assertConflict();

        $this->assertDatabaseCount('requests', 1);
        $this->assertDatabaseCount('request_events', 1);
        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_same_key_is_scoped_to_the_authenticated_actor(): void
    {
        $data = $this->requestData();

        $first = $this->postJson('/api/requests', $data, $this->headers('actor-key'))->assertCreated();
        $second = $this->postJson('/api/requests', $data, $this->headers('actor-key', 'actor-two'))->assertCreated();

        $this->assertNotSame($first->json('id'), $second->json('id'));
        $this->assertDatabaseCount('requests', 2);
        $this->assertDatabaseCount('request_events', 2);
        $this->assertDatabaseCount('notifications', 2);
    }

    public function test_requests_without_an_idempotency_key_retain_existing_behavior(): void
    {
        $this->postJson('/api/requests', $this->requestData(), $this->headers())->assertCreated();
        $this->postJson('/api/requests', $this->requestData(), $this->headers())->assertCreated();

        $this->assertDatabaseCount('requests', 2);
        $this->assertDatabaseCount('request_events', 2);
        $this->assertDatabaseCount('notifications', 2);
        $this->assertDatabaseCount('idempotency_keys', 0);
    }

    public function test_failed_request_does_not_reserve_the_key(): void
    {
        $headers = $this->headers('failed-key');

        $this->postJson('/api/requests', $this->requestData(['cluster' => null]), $headers)->assertUnprocessable();
        $this->assertDatabaseCount('idempotency_keys', 0);

        $this->postJson('/api/requests', $this->requestData(), $headers)->assertCreated();
        $this->assertDatabaseCount('requests', 1);
        $this->assertDatabaseCount('idempotency_keys', 1);
    }

    public function test_expired_keys_are_removed_by_the_prune_command(): void
    {
        DB::table('idempotency_keys')->insert([
            'key' => 'expired-key',
            'actor_id' => $this->actorOne,
            'method' => 'POST',
            'path' => 'api/requests',
            'request_hash' => hash('sha256', 'expired'),
            'response_status' => 201,
            'response_body' => '{}',
            'created_at' => now()->subDay(),
            'expires_at' => now()->subMinute(),
        ]);
        DB::table('idempotency_keys')->insert([
            'key' => 'active-key',
            'actor_id' => $this->actorOne,
            'method' => 'POST',
            'path' => 'api/requests',
            'request_hash' => hash('sha256', 'active'),
            'response_status' => 201,
            'response_body' => '{}',
            'created_at' => now(),
            'expires_at' => now()->addHour(),
        ]);

        $this->artisan('idempotency:prune')->assertExitCode(0);

        $this->assertDatabaseMissing('idempotency_keys', ['key' => 'expired-key']);
        $this->assertDatabaseHas('idempotency_keys', ['key' => 'active-key']);
    }

    public function test_transition_is_replayed_without_duplicate_events_or_notifications(): void
    {
        $request = $this->insertRequest(['status' => 'PENDING']);
        $headers = $this->headers('transition-key');

        $first = $this->postJson('/api/requests/'.$request->id.'/approve', [], $headers)->assertOk();
        $second = $this->postJson('/api/requests/'.$request->id.'/approve', [], $headers)->assertOk();

        $this->assertSame($first->json(), $second->json());
        $this->assertDatabaseCount('request_events', 1);
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('requests', ['id' => $request->id, 'status' => 'APPROVED']);
    }

    public function test_update_is_replayed_without_duplicate_events(): void
    {
        $request = $this->insertRequest(['status' => 'PENDING']);
        $data = $this->requestData(['cluster' => 'SOC 6']);
        $headers = $this->headers('update-key');

        $first = $this->putJson('/api/requests/'.$request->id, $data, $headers)->assertOk();
        $second = $this->putJson('/api/requests/'.$request->id, $data, $headers)->assertOk();

        $this->assertSame($first->json(), $second->json());
        $this->assertDatabaseCount('request_events', 1);
        $this->assertDatabaseHas('requests', ['id' => $request->id, 'cluster' => 'SOC 6']);
    }

    public function test_action_rejects_fields_not_allowed_for_that_transition(): void
    {
        $request = $this->insertRequest(['status' => 'PENDING']);

        $this->postJson('/api/requests/'.$request->id.'/approve', [
            'truck_type' => 'DRYLEASE',
        ], $this->headers())->assertUnprocessable()->assertJsonValidationErrors('payload');

        $this->assertDatabaseHas('requests', ['id' => $request->id, 'status' => 'PENDING', 'truck_type' => 'WETLEASE']);
        $this->assertDatabaseCount('request_events', 0);
    }

    private function headers(string $key = '', string $token = 'actor-one'): array
    {
        return array_filter([
            'Authorization' => 'Bearer '.$token,
            'Idempotency-Key' => $key,
        ]);
    }

    private function requestData(array $overrides = []): array
    {
        return array_merge([
            'cluster' => 'SOC 5',
            'region' => 'NCR',
            'dock_no' => 'D-01',
            'backlogs' => 10,
            'truck_size' => '6W',
            'truck_type' => 'WETLEASE',
        ], $overrides);
    }

    private function insertActor(string $id, string $email): void
    {
        DB::table('profiles')->insert([
            'id' => $id,
            'name' => $email,
            'role' => 'fte_ops',
            'is_active' => true,
            'email' => $email,
            'ops_id' => null,
            'must_change_password' => false,
            'password_reset_at' => null,
            'password_changed_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertRequest(array $overrides = []): object
    {
        $id = (string) Str::uuid();
        DB::table('requests')->insert(array_merge([
            'id' => $id,
            'request_timestamp' => '2026-06-30 08:00:00',
            'cluster' => 'SOC 5',
            'region' => 'NCR',
            'dock_no' => 'D-01',
            'backlogs' => 10,
            'truck_size' => '6W',
            'truck_type' => 'WETLEASE',
            'status' => 'PENDING',
            'created_by' => $this->actorOne,
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));

        return DB::table('requests')->where('id', $id)->first();
    }

    private function createSchema(): void
    {
        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('role');
            $table->boolean('is_active')->default(true);
            $table->string('email')->nullable();
            $table->string('ops_id')->nullable();
            $table->boolean('must_change_password')->default(false);
            $table->timestamp('password_reset_at')->nullable();
            $table->timestamp('password_changed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('requests', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->dateTime('request_timestamp')->useCurrent();
            $table->string('cluster');
            $table->string('region');
            $table->string('dock_no');
            $table->integer('backlogs');
            $table->dateTime('backlogs_timestamp')->nullable();
            $table->string('ob_fte')->nullable();
            $table->string('truck_size');
            $table->string('truck_type');
            $table->string('plate_number')->nullable();
            $table->dateTime('provide_time')->nullable();
            $table->string('linehaul_trip_no')->nullable();
            $table->dateTime('docked_time')->nullable();
            $table->string('status');
            $table->text('rejection_remarks')->nullable();
            $table->string('driver_id')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->dateTime('rejected_at')->nullable();
            $table->dateTime('confirmed_at')->nullable();
            $table->uuid('created_by');
            $table->timestamps();
        });
        Schema::create('request_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('request_id');
            $table->string('event_type');
            $table->uuid('actor_id')->nullable();
            $table->string('from_status')->nullable();
            $table->string('to_status')->nullable();
            $table->text('metadata')->nullable();
            $table->timestamps();
        });
        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();
            $table->uuid('request_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->string('target_role')->nullable();
            $table->string('event_type');
            $table->string('title');
            $table->text('body');
            $table->timestamps();
        });
        Schema::create('idempotency_keys', function (Blueprint $table): void {
            $table->id();
            $table->string('key', 255);
            $table->string('actor_id', 255);
            $table->string('method', 10);
            $table->string('path', 500);
            $table->string('request_hash', 64);
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->json('response_body')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->unique(['actor_id', 'key']);
        });
    }
}
