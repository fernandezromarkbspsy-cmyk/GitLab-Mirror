<?php

namespace Tests\Unit;

use App\Services\AppwriteAuditService;
use App\Services\AppwriteService;
use Illuminate\Http\Request;
use Mockery;
use Tests\TestCase;

final class AppwriteAuditServiceTest extends TestCase
{
    public function test_appwrite_audit_payload_is_allowlisted_and_captures_request_context(): void
    {
        config()->set('services.auth.provider', 'appwrite');
        $appwrite = Mockery::mock(AppwriteService::class);
        $appwrite->shouldReceive('createAuditLog')->once()->with(Mockery::on(function (array $data): bool {
            $metadata = json_decode($data['metadata'], true, 512, JSON_THROW_ON_ERROR);

            return $data['event_type'] === 'login_failed'
                && $data['user_id'] === 'user-1'
                && $data['actor_id'] === null
                && $data['target_id'] === 'user-1'
                && $data['auth_provider'] === 'appwrite'
                && $data['ip'] === '203.0.113.10'
                && $data['user_agent'] === 'test-agent'
                && $metadata === ['reason' => 'invalid_credentials'];
        }));

        $request = Request::create('/api/auth/backroom/login', 'POST', [], [], [], ['REMOTE_ADDR' => '203.0.113.10']);
        $request->headers->set('User-Agent', 'test-agent');
        (new AppwriteAuditService($appwrite))->record('login_failed', 'user-1', null, 'user-1', $request, [
            'reason' => 'invalid_credentials', 'password' => 'never-store', 'token' => 'never-store', 'jwt' => 'never-store',
        ]);
    }

    public function test_audit_failure_is_swallowed_and_non_appwrite_is_a_no_op(): void
    {
        config()->set('services.auth.provider', 'appwrite');
        $appwrite = Mockery::mock(AppwriteService::class);
        $appwrite->shouldReceive('createAuditLog')->once()->andThrow(new \RuntimeException('audit unavailable'));

        (new AppwriteAuditService($appwrite))->record('logout', 'user-1');

        config()->set('services.auth.provider', 'supabase');
        $appwrite->shouldNotReceive('createAuditLog');
        (new AppwriteAuditService($appwrite))->record('logout', 'user-1');
        $this->assertTrue(true);
    }
}
