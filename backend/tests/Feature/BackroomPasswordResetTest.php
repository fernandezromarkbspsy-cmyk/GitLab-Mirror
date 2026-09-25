<?php

namespace Tests\Feature;

use App\Features\Users\UserController;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use PDO;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

final class BackroomPasswordResetTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for isolated password reset tests.');
        }
        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('role');
            $table->boolean('is_active')->default(true);
            $table->string('ops_id')->nullable();
            $table->boolean('must_change_password')->default(false);
            $table->timestamp('password_reset_at')->nullable();
            $table->timestamp('password_changed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('user_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('user_id');
            $table->uuid('actor_id')->nullable();
            $table->string('event_type');
            $table->text('metadata');
            $table->timestamp('created_at')->useCurrent();
        });
        Schema::create('user_event_retries', function (Blueprint $table): void {
            $table->id();
            $table->uuid('user_id');
            $table->uuid('actor_id')->nullable();
            $table->string('event_type');
            $table->text('metadata');
            $table->string('status')->default('confirmed');
            $table->unsignedInteger('attempts')->default(0);
            $table->timestamp('available_at');
            $table->text('last_error')->nullable();
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
            'name' => 'Backroom User',
            'role' => 'ops_pic',
            'is_active' => true,
            'ops_id' => 'ops123',
            'must_change_password' => false,
            'password_reset_at' => null,
            'password_changed_at' => now()->subDay(),
            'created_at' => now()->subDays(10),
            'updated_at' => now()->subDay(),
        ], $overrides));

        return $id;
    }

    private function request(string $actorId): Request
    {
        $request = Request::create('/api/users/'.$actorId.'/reset-password', 'POST');
        $request->attributes->set('actor', (object) ['id' => (string) Str::uuid(), 'role' => 'fte_ops']);

        return $request;
    }

    public function test_reset_sets_first_login_state_and_returns_temporary_password(): void
    {
        $id = $this->insertProfile();
        Http::fake([
            'https://test-project.supabase.co/auth/v1/admin/users/*' => Http::response(['id' => $id], 200),
        ]);

        $response = (new UserController)->resetPassword($this->request($id), $id);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertNotEmpty($response->getData(true)['initial_password']);
        $profile = DB::table('profiles')->where('id', $id)->first();
        $this->assertTrue((bool) $profile->must_change_password);
        $this->assertNull($profile->password_changed_at);
        $this->assertNotNull($profile->password_reset_at);
    }

    public function test_supabase_failure_restores_previous_profile_state(): void
    {
        $resetAt = now()->subDays(2);
        $changedAt = now()->subDay();
        $id = $this->insertProfile([
            'password_reset_at' => $resetAt,
            'password_changed_at' => $changedAt,
        ]);
        Http::fake([
            'https://test-project.supabase.co/auth/v1/admin/users/*' => Http::response(['error' => 'unavailable'], 503),
        ]);

        try {
            (new UserController)->resetPassword($this->request($id), $id);
            $this->fail('The reset should fail when Supabase rejects the update.');
        } catch (HttpException $exception) {
            $this->assertSame(502, $exception->getStatusCode());
        } finally {
            $profile = DB::table('profiles')->where('id', $id)->first();
            $this->assertFalse((bool) $profile->must_change_password);
            $this->assertSame($changedAt->toDateTimeString(), $profile->password_changed_at);
            $this->assertSame($resetAt->toDateTimeString(), $profile->password_reset_at);
        }
    }

    public function test_audit_failure_preserves_reset_state_and_returns_password(): void
    {
        $id = $this->insertProfile();
        Schema::drop('user_events');
        Http::fake([
            'https://test-project.supabase.co/auth/v1/admin/users/*' => Http::response(['id' => $id], 200),
        ]);

        $response = (new UserController)->resetPassword($this->request($id), $id);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertFalse($response->getData(true)['audit_recorded']);
        $this->assertNotEmpty($response->getData(true)['initial_password']);
        $this->assertTrue((bool) DB::table('profiles')->where('id', $id)->value('must_change_password'));
        $this->assertDatabaseHas('user_event_retries', ['user_id' => $id, 'event_type' => 'PASSWORD_RESET']);
    }
}
