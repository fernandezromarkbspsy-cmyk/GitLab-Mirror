<?php

namespace Tests\Feature;

use App\Services\AppwriteService;
use Illuminate\Support\Facades\Http;
use Mockery;
use Tests\TestCase;

final class AppwriteBackroomLoginTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('services.auth.provider', 'appwrite');
        config()->set('services.appwrite', [
            'endpoint' => 'https://sgp.cloud.appwrite.io/v1',
            'project_id' => 'project-test',
            'api_key' => 'server-key-test',
            'database_id' => 'soc5_outbound',
            'ca_bundle' => '',
            'timeout' => 10,
            'tables' => ['profiles' => 'profiles'],
        ]);
    }

    private function fakeSuccessfulAuthentication(array $profile = []): void
    {
        Http::fake([
            'https://sgp.cloud.appwrite.io/v1/account/sessions/email' => Http::response([
                '$id' => 'session-1',
                'userId' => 'appwrite-user-1',
                'secret' => 'session-secret',
                'expire' => now()->addHour()->toISOString(),
            ]),
            'https://sgp.cloud.appwrite.io/v1/tablesdb/soc5_outbound/tables/profiles/appwrite-user-1' => Http::response(array_merge([
                '$id' => 'appwrite-user-1',
                'ops_id' => 'ops123',
                'role' => 'ops_pic',
                'is_active' => true,
                'must_change_password' => true,
            ], $profile)),
            'https://sgp.cloud.appwrite.io/v1/account/jwt' => Http::response(['jwt' => 'appwrite-jwt']),
            'https://sgp.cloud.appwrite.io/v1/tablesdb/soc5_outbound/tables/sessions/rows' => Http::response([
                '$id' => 'session-1',
            ]),
        ]);
    }

    public function test_successful_login_authenticates_with_appwrite_and_returns_compatible_tokens(): void
    {
        $this->fakeSuccessfulAuthentication();

        $this->postJson('/api/auth/backroom/login', [
            'ops_id' => 'ops123',
            'password' => 'correct-password',
            'mode' => 'first-login',
        ])->assertOk()
            ->assertExactJson(['access_token' => 'appwrite-jwt', 'refresh_token' => null]);

        Http::assertSent(fn ($request): bool => $request->url() === 'https://sgp.cloud.appwrite.io/v1/account/sessions/email'
            && $request->data()['email'] === 'ops123@backroom.soc5.internal'
            && ! $request->hasHeader('X-Appwrite-Key'));
        Http::assertSent(fn ($request): bool => $request->url() === 'https://sgp.cloud.appwrite.io/v1/account/jwt'
            && $request->header('X-Appwrite-Session')[0] === 'session-secret');
        Http::assertSent(fn ($request): bool => $request->url() === 'https://sgp.cloud.appwrite.io/v1/tablesdb/soc5_outbound/tables/sessions/rows'
            && $request->data()['rowId'] === 'session-1'
            && array_keys($request->data()['data']) === [
                'user_id', 'appwrite_session_id', 'expires_at', 'created_at', 'revoked_at',
                'ip', 'user_agent', 'metadata', 'auth_provider',
            ]
            && $request->data()['data']['user_id'] === 'appwrite-user-1'
            && $request->data()['data']['appwrite_session_id'] === 'session-1'
            && $request->data()['data']['revoked_at'] === null
            && $request->data()['data']['ip'] === '127.0.0.1'
            && $request->data()['data']['metadata'] === '{"source":"backroom_login"}'
            && $request->data()['data']['auth_provider'] === 'appwrite');
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        Http::fake([
            'https://sgp.cloud.appwrite.io/v1/account/sessions/email' => Http::response(['message' => 'Invalid credentials'], 401),
        ]);

        $this->postJson('/api/auth/backroom/login', [
            'ops_id' => 'ops123', 'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    public function test_missing_appwrite_user_is_rejected(): void
    {
        Http::fake([
            'https://sgp.cloud.appwrite.io/v1/account/sessions/email' => Http::response([
                '$id' => 'session-1', 'secret' => 'session-secret',
            ]),
        ]);

        $this->postJson('/api/auth/backroom/login', [
            'ops_id' => 'ops123', 'password' => 'correct-password',
        ])->assertUnauthorized();
    }

    public function test_missing_profile_is_rejected(): void
    {
        Http::fake([
            'https://sgp.cloud.appwrite.io/v1/account/sessions/email' => Http::response([
                '$id' => 'session-1', 'userId' => 'appwrite-user-1', 'secret' => 'session-secret',
                'expire' => now()->addHour()->toISOString(),
            ]),
            'https://sgp.cloud.appwrite.io/v1/tablesdb/soc5_outbound/tables/profiles/appwrite-user-1' => Http::response([], 404),
        ]);

        $this->postJson('/api/auth/backroom/login', [
            'ops_id' => 'ops123', 'password' => 'correct-password',
        ])->assertForbidden();
    }

    public function test_inactive_profile_is_rejected(): void
    {
        $this->fakeSuccessfulAuthentication(['is_active' => false]);

        $this->postJson('/api/auth/backroom/login', [
            'ops_id' => 'ops123', 'password' => 'correct-password',
        ])->assertForbidden();
    }

    public function test_first_login_requires_the_profile_flag(): void
    {
        $this->fakeSuccessfulAuthentication(['must_change_password' => false]);

        $this->postJson('/api/auth/backroom/login', [
            'ops_id' => 'ops123', 'password' => 'correct-password', 'mode' => 'first-login',
        ])->assertStatus(409);
    }

    public function test_logout_revokes_appwrite_and_local_sessions(): void
    {
        $service = Mockery::mock(AppwriteService::class)->makePartial();
        $service->shouldReceive('currentSessionForJwt')->with('appwrite-jwt')->once()->andReturn([
            '$id' => 'session-1', 'userId' => 'appwrite-user-1',
        ]);
        $this->app->instance(AppwriteService::class, $service);

        Http::fake([
            'https://sgp.cloud.appwrite.io/v1/users/appwrite-user-1/sessions/session-1' => Http::response([], 204),
            'https://sgp.cloud.appwrite.io/v1/tablesdb/soc5_outbound/tables/sessions/session-1' => Http::sequence()
                ->push(['$id' => 'session-1', 'revoked_at' => null])
                ->push(['$id' => 'session-1', 'revoked_at' => now()->toISOString()]),
        ]);

        $this->withToken('appwrite-jwt')
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertExactJson(['ok' => true]);

        Http::assertSent(fn ($request): bool => $request->method() === 'DELETE'
            && $request->url() === 'https://sgp.cloud.appwrite.io/v1/users/appwrite-user-1/sessions/session-1'
            && $request->header('X-Appwrite-Key')[0] === 'server-key-test');
        Http::assertSent(fn ($request): bool => $request->method() === 'PATCH'
            && $request->url() === 'https://sgp.cloud.appwrite.io/v1/tablesdb/soc5_outbound/tables/sessions/session-1'
            && is_string($request->data()['data']['revoked_at'] ?? null));
    }

    public function test_repeated_logout_of_missing_or_revoked_session_is_safe(): void
    {
        $service = Mockery::mock(AppwriteService::class)->makePartial();
        $service->shouldReceive('currentSessionForJwt')->with('already-revoked-jwt')->once()->andThrow(new \Appwrite\AppwriteException('Session not found', 404));
        $this->app->instance(AppwriteService::class, $service);

        Http::fake([
            'https://sgp.cloud.appwrite.io/v1/account/sessions/current*' => Http::response([], 404),
        ]);

        $this->withToken('already-revoked-jwt')
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertExactJson(['ok' => true]);

        Http::assertNotSent(fn ($request): bool => str_contains($request->url(), '/users/'));
    }

    public function test_supabase_logout_path_remains_a_no_op_for_server_auth(): void
    {
        config()->set('services.auth.provider', 'supabase');
        Http::fake();

        $this->withToken('supabase-token')
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertExactJson(['ok' => true]);

        Http::assertNothingSent();
    }
}
