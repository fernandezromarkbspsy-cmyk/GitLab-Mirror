<?php

namespace Tests\Feature;

use App\Http\Middleware\AuthenticateAppwrite;
use App\Services\AppwriteService;
use Appwrite\AppwriteException;
use Mockery;
use Tests\TestCase;

final class AuthenticateAppwriteTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_missing_bearer_token_is_rejected(): void
    {
        $service = Mockery::mock(AppwriteService::class);
        $service->shouldReceive('accountForJwt')->never();

        $this->app->instance(AppwriteService::class, $service);
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_valid_appwrite_user_loads_active_profile_and_preserves_view_role(): void
    {
        $id = 'appwrite-user-1';
        $profile = (object) [
            'id' => $id, 'name' => 'Admin', 'role' => 'fte_ops', 'email' => 'admin@example.test',
            'ops_id' => null, 'must_change_password' => false, 'password_reset_at' => null,
            'password_changed_at' => null, 'created_at' => now(),
        ];
        config()->set('services.auth.provider', 'appwrite');
        config()->set('services.admin_emails', ['admin@example.test']);

        $account = Mockery::mock(\Appwrite\Services\Account::class);
        $account->shouldReceive('get')->once()->andReturn(['$id' => $id]);
        $service = Mockery::mock(AppwriteService::class);
        $service->shouldReceive('accountForJwt')->with('test-jwt')->andReturn($account);
        $service->shouldReceive('currentSessionForJwt')->with('test-jwt')->andReturn([
            '$id' => 'session-1', 'userId' => $id,
        ]);
        $service->shouldReceive('profileForUser')->with($id)->andReturn((array) $profile);
        $service->shouldReceive('getRow')->with('sessions', 'session-1')->andReturn([
            'user_id' => $id, 'auth_provider' => 'appwrite', 'revoked_at' => null,
            'expires_at' => now()->addHour()->toISOString(),
        ]);
        $this->app->instance(AppwriteService::class, $service);

        $this->withHeader('Authorization', 'Bearer test-jwt')
            ->withHeader('X-View-Role', 'doc_officer')
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('id', $id)
            ->assertJsonPath('role', 'doc_officer')
            ->assertJsonPath('original_role', 'fte_ops')
            ->assertJsonPath('is_admin', true);
    }

    public function test_expired_or_invalid_appwrite_jwt_is_rejected(): void
    {
        $account = Mockery::mock(\Appwrite\Services\Account::class);
        $account->shouldReceive('get')->once()->andThrow(new AppwriteException('JWT expired'));
        $service = Mockery::mock(AppwriteService::class);
        $service->shouldReceive('accountForJwt')->with('expired-jwt')->andReturn($account);
        $this->app->instance(AppwriteService::class, $service);

        config()->set('services.auth.provider', 'appwrite');

        $this->withHeader('Authorization', 'Bearer expired-jwt')
            ->getJson('/api/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Invalid or expired session.');
    }

    public function test_missing_appwrite_profile_is_rejected(): void
    {
        $account = Mockery::mock(\Appwrite\Services\Account::class);
        $account->shouldReceive('get')->once()->andReturn(['$id' => 'missing-profile']);
        $service = Mockery::mock(AppwriteService::class);
        $service->shouldReceive('accountForJwt')->with('test-jwt')->andReturn($account);
        $service->shouldReceive('currentSessionForJwt')->with('test-jwt')->andReturn([
            '$id' => 'session-1', 'userId' => 'missing-profile',
        ]);
        $service->shouldReceive('profileForUser')->with('missing-profile')->andReturn(null);
        $service->shouldReceive('getRow')->with('sessions', 'session-1')->andReturn([
            'user_id' => 'missing-profile', 'auth_provider' => 'appwrite', 'revoked_at' => null,
            'expires_at' => now()->addHour()->toISOString(),
        ]);
        $this->app->instance(AppwriteService::class, $service);

        config()->set('services.auth.provider', 'appwrite');

        $this->withHeader('Authorization', 'Bearer test-jwt')
            ->getJson('/api/auth/me')
            ->assertForbidden()
            ->assertJsonPath('message', 'Account is disabled or not provisioned.');
    }

    public function test_inactive_appwrite_profile_is_rejected(): void
    {
        $account = Mockery::mock(\Appwrite\Services\Account::class);
        $account->shouldReceive('get')->once()->andReturn(['$id' => 'inactive-user']);
        $service = Mockery::mock(AppwriteService::class);
        $service->shouldReceive('accountForJwt')->with('test-jwt')->andReturn($account);
        $service->shouldReceive('currentSessionForJwt')->with('test-jwt')->andReturn([
            '$id' => 'session-1', 'userId' => 'inactive-user',
        ]);
        $service->shouldReceive('profileForUser')->with('inactive-user')->andReturn([
            '$id' => 'inactive-user', 'email' => 'inactive@example.test', 'role' => 'fte_ops', 'is_active' => false,
            'must_change_password' => false,
        ]);
        $service->shouldReceive('getRow')->with('sessions', 'session-1')->andReturn([
            'user_id' => 'inactive-user', 'auth_provider' => 'appwrite', 'revoked_at' => null,
            'expires_at' => now()->addHour()->toISOString(),
        ]);
        $this->app->instance(AppwriteService::class, $service);

        config()->set('services.auth.provider', 'appwrite');

        $this->withHeader('Authorization', 'Bearer test-jwt')
            ->getJson('/api/auth/me')
            ->assertForbidden()
            ->assertJsonPath('message', 'Account is disabled or not provisioned.');
    }

    public function test_revoked_local_appwrite_session_is_rejected(): void
    {
        $id = 'revoked-user';
        $account = Mockery::mock(\Appwrite\Services\Account::class);
        $account->shouldReceive('get')->once()->andReturn(['$id' => $id]);
        $service = Mockery::mock(AppwriteService::class);
        $service->shouldReceive('accountForJwt')->with('test-jwt')->andReturn($account);
        $service->shouldReceive('currentSessionForJwt')->with('test-jwt')->andReturn([
            '$id' => 'session-1', 'userId' => $id,
        ]);
        $service->shouldReceive('getRow')->with('sessions', 'session-1')->andReturn([
            'user_id' => $id, 'auth_provider' => 'appwrite',
            'revoked_at' => now()->toISOString(), 'expires_at' => now()->addHour()->toISOString(),
        ]);
        $this->app->instance(AppwriteService::class, $service);
        config()->set('services.auth.provider', 'appwrite');

        $this->withToken('test-jwt')
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    public function test_expired_local_appwrite_session_is_rejected(): void
    {
        $id = 'expired-user';
        $account = Mockery::mock(\Appwrite\Services\Account::class);
        $account->shouldReceive('get')->once()->andReturn(['$id' => $id]);
        $service = Mockery::mock(AppwriteService::class);
        $service->shouldReceive('accountForJwt')->with('test-jwt')->andReturn($account);
        $service->shouldReceive('currentSessionForJwt')->with('test-jwt')->andReturn([
            '$id' => 'session-1', 'userId' => $id,
        ]);
        $service->shouldReceive('getRow')->with('sessions', 'session-1')->andReturn([
            'user_id' => $id, 'auth_provider' => 'appwrite', 'revoked_at' => null,
            'expires_at' => now()->subMinute()->toISOString(),
        ]);
        $this->app->instance(AppwriteService::class, $service);
        config()->set('services.auth.provider', 'appwrite');

        $this->withToken('test-jwt')
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }
}
