<?php

namespace Tests\Feature;

use App\Features\Users\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

final class AppwriteUserLifecycleTest extends TestCase
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

    private function request(string $method, string $uri, array $payload = []): Request
    {
        $request = Request::create($uri, $method, $payload);
        $request->attributes->set('actor', (object) ['id' => 'fte-user-1', 'role' => 'fte_ops']);

        return $request;
    }

    public function test_create_writes_auth_user_and_complete_active_profile(): void
    {
        Http::fake([
            '*/tablesdb/*/tables/audit_logs/rows' => Http::response(['$id' => 'audit-1'], 201),
            '*/tablesdb/*/tables/profiles/rows?*' => Http::response(['rows' => []]),
            '*/users' => Http::response(['$id' => 'appwrite-user-1'], 201),
            '*/tablesdb/*/tables/profiles/rows' => Http::response(['$id' => 'appwrite-user-1'], 201),
        ]);

        $response = app(UserController::class)->store($this->request('POST', '/api/users', [
            'name' => 'Ops User', 'ops_id' => 'OPS123',
        ]));

        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame('appwrite-user-1', $response->getData(true)['id']);
        Http::assertSent(fn ($request): bool => $request->method() === 'POST'
            && str_ends_with($request->url(), '/users')
            && $request->header('X-Appwrite-Key')[0] === 'server-key-test'
            && $request->data()['email'] === 'ops123@backroom.soc5.internal');
        Http::assertSent(fn ($request): bool => $request->method() === 'POST'
            && str_contains($request->url(), '/tablesdb/')
            && ($request->data()['rowId'] ?? null) === 'appwrite-user-1'
            && $request->data()['data']['ops_id'] === 'ops123'
            && $request->data()['data']['is_active'] === true
            && array_key_exists('password_changed_at', $request->data()['data'])
            && array_key_exists('password_reset_at', $request->data()['data']));
    }

    public function test_duplicate_auth_user_is_rejected_without_profile_write(): void
    {
        Http::fake([
            '*/tablesdb/*/tables/audit_logs/rows' => Http::response(['$id' => 'audit-1'], 201),
            '*/tablesdb/*/tables/profiles/rows?*' => Http::response(['rows' => []]),
            '*/users' => Http::response(['message' => 'already exists'], 409),
        ]);

        $this->expectException(HttpException::class);
        try {
            app(UserController::class)->store($this->request('POST', '/api/users', ['name' => 'Ops User', 'ops_id' => 'ops123']));
        } finally {
            Http::assertNotSent(fn ($request): bool => $request->method() === 'POST' && str_contains($request->url(), '/tablesdb/'));
        }
    }

    public function test_update_and_status_lifecycle_uses_appwrite_only(): void
    {
        Http::fake([
            '*/tablesdb/*/tables/audit_logs/rows' => Http::response(['$id' => 'audit-1'], 201),
            '*/tablesdb/*/tables/profiles/appwrite-user-1' => Http::response(['$id' => 'appwrite-user-1', 'is_active' => true]),
            '*/users/appwrite-user-1/name' => Http::response([]),
            '*/users/appwrite-user-1/status' => Http::response([]),
            '*/users/appwrite-user-1/sessions' => Http::response([], 204),
        ]);

        $controller = app(UserController::class);
        $controller->update($this->request('PUT', '/api/users/appwrite-user-1', ['name' => 'Updated User', 'role' => 'ops_pic']), 'appwrite-user-1');
        $controller->disable($this->request('PATCH', '/api/users/appwrite-user-1/disable'), 'appwrite-user-1');
        $controller->activate($this->request('PATCH', '/api/users/appwrite-user-1/enable'), 'appwrite-user-1');

        Http::assertSent(fn ($request): bool => $request->method() === 'PUT'
            && str_ends_with($request->url(), '/users/appwrite-user-1/status')
            && $request->data()['status'] === false);
        Http::assertSent(fn ($request): bool => $request->method() === 'DELETE'
            && str_ends_with($request->url(), '/users/appwrite-user-1/sessions'));
        Http::assertSent(fn ($request): bool => $request->method() === 'PUT'
            && str_ends_with($request->url(), '/users/appwrite-user-1/status')
            && $request->data()['status'] === true);
    }
}
