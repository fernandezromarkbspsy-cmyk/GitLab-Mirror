<?php

namespace Tests\Feature;

use App\Features\Users\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class AppwritePasswordRecoveryTest extends TestCase
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
            'tables' => ['profiles' => 'profiles', 'password_resets' => 'password_resets'],
        ]);
    }

    private function request(string $method, string $uri, array $payload = [], bool $admin = false): Request
    {
        $request = Request::create($uri, $method, $payload);
        if ($admin) {
            $request->attributes->set('actor', (object) ['id' => 'fte-user-1', 'role' => 'fte_ops']);
        }

        return $request;
    }

    public function test_reset_request_is_non_enumerating_and_records_no_secret(): void
    {
        Http::fake([
            '*/tablesdb/*/tables/audit_logs/rows' => Http::response(['$id' => 'audit-1'], 201),
            '*/tablesdb/*/tables/profiles/rows?*' => Http::response(['rows' => [[
                '$id' => 'appwrite-user-1', 'email' => 'ops123@backroom.soc5.internal', 'role' => 'ops_pic', 'is_active' => true,
            ]]]),
            '*/account/recovery' => Http::response([], 200),
            '*/tablesdb/*/tables/password_resets/rows' => Http::response(['$id' => 'reset-1'], 201),
        ]);

        $existing = app(UserController::class)->requestPasswordReset($this->request('POST', '/api/auth/backroom/password-reset/request', ['ops_id' => 'ops123']))->getData(true);

        Http::fake();
        $missing = app(UserController::class)->requestPasswordReset($this->request('POST', '/api/auth/backroom/password-reset/request', ['ops_id' => 'ops999']))->getData(true);

        $this->assertSame(202, app(UserController::class)->requestPasswordReset($this->request('POST', '/api/auth/backroom/password-reset/request', ['ops_id' => 'ops999']))->getStatusCode());
        $this->assertSame($existing, $missing);
        $this->assertSame(['ok' => true, 'message' => 'If the account exists, recovery instructions have been sent.'], $existing);
    }

    public function test_completion_updates_auth_profile_and_reset_lifecycle_without_persisting_secret(): void
    {
        Http::fake([
            '*/tablesdb/*/tables/audit_logs/rows' => Http::response(['$id' => 'audit-1'], 201),
            '*/tablesdb/*/tables/profiles/appwrite-user-1' => Http::sequence()
                ->push(['$id' => 'appwrite-user-1', 'role' => 'ops_pic', 'is_active' => true])
                ->push(['$id' => 'appwrite-user-1']),
            '*/account/recovery' => Http::response([], 200),
            '*/tablesdb/*/tables/password_resets/rows?*' => Http::response(['rows' => [['$id' => 'reset-1', 'status' => 'requested']]]),
            '*/tablesdb/*/tables/password_resets/reset-1' => Http::response(['$id' => 'reset-1']),
        ]);

        $response = app(UserController::class)->completePasswordReset($this->request('POST', '/api/auth/backroom/password-reset/complete', [
            'user_id' => 'appwrite-user-1', 'secret' => 'one-time-secret', 'password' => 'new-secure-password', 'password_confirmation' => 'new-secure-password',
        ]));

        $this->assertSame(['ok' => true], $response->getData(true));
        Http::assertSent(fn ($request): bool => $request->method() === 'PUT'
            && str_ends_with($request->url(), '/account/recovery')
            && $request->data()['userId'] === 'appwrite-user-1'
            && $request->data()['secret'] === 'one-time-secret');
        Http::assertSent(fn ($request): bool => $request->method() === 'PATCH'
            && str_ends_with($request->url(), '/tables/profiles/appwrite-user-1')
            && $request->data()['data']['must_change_password'] === false
            && is_string($request->data()['data']['password_changed_at'])
            && is_string($request->data()['data']['password_reset_at']));
        Http::assertSent(fn ($request): bool => $request->method() === 'PATCH'
            && str_ends_with($request->url(), '/tables/password_resets/reset-1')
            && $request->data()['data'] === ['status' => 'completed', 'completed_at' => $request->data()['data']['completed_at']]);
        Http::assertNotSent(fn ($request): bool => str_contains($request->url(), '/tables/password_resets')
            && (isset($request->data()['data']['secret']) || isset($request->data()['data']['password'])));
    }

    public function test_invalid_or_reused_recovery_is_rejected_without_profile_update(): void
    {
        Http::fake([
            '*/tablesdb/*/tables/audit_logs/rows' => Http::response(['$id' => 'audit-1'], 201),
            '*/tablesdb/*/tables/profiles/appwrite-user-1' => Http::response(['$id' => 'appwrite-user-1', 'role' => 'ops_pic', 'is_active' => true]),
            '*/account/recovery' => Http::response(['message' => 'expired'], 401),
        ]);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);
        try {
            app(UserController::class)->completePasswordReset($this->request('POST', '/api/auth/backroom/password-reset/complete', [
                'user_id' => 'appwrite-user-1', 'secret' => 'expired-secret', 'password' => 'new-secure-password', 'password_confirmation' => 'new-secure-password',
            ]));
        } finally {
            Http::assertNotSent(fn ($request): bool => $request->method() === 'PATCH');
        }
    }

    public function test_admin_reset_uses_appwrite_and_records_actor_reason(): void
    {
        Http::fake([
            '*/tablesdb/*/tables/audit_logs/rows' => Http::response(['$id' => 'audit-1'], 201),
            '*/tablesdb/*/tables/profiles/appwrite-user-1' => Http::response(['$id' => 'appwrite-user-1', 'role' => 'ops_pic', 'is_active' => true]),
            '*/users/appwrite-user-1/password' => Http::response([]),
            '*/tablesdb/*/tables/password_resets/rows' => Http::response(['$id' => 'reset-1'], 201),
        ]);

        $response = app(UserController::class)->resetPassword($this->request('POST', '/api/users/appwrite-user-1/reset-password', [], true), 'appwrite-user-1');

        $this->assertSame(200, $response->getStatusCode());
        Http::assertSent(fn ($request): bool => $request->method() === 'PUT'
            && str_ends_with($request->url(), '/users/appwrite-user-1/password')
            && $request->data()['password'] !== '');
        Http::assertSent(fn ($request): bool => $request->method() === 'POST'
            && str_contains($request->url(), '/tables/password_resets/rows')
            && $request->data()['data']['actor_id'] === 'fte-user-1'
            && $request->data()['data']['reason'] === 'admin-reset'
            && ! array_key_exists('token', $request->data()['data']));
    }

    public function test_supabase_reset_request_path_remains_non_appwrite(): void
    {
        config()->set('services.auth.provider', 'supabase');
        Http::fake();

        $response = app(UserController::class)->requestPasswordReset($this->request('POST', '/api/auth/backroom/password-reset/request', ['ops_id' => 'ops123']));

        $this->assertSame(202, $response->getStatusCode());
        Http::assertNothingSent();
    }
}
