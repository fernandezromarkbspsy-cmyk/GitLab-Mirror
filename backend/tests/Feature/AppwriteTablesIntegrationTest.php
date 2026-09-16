<?php

namespace Tests\Feature;

use App\Services\AppwriteService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class AppwriteTablesIntegrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('services.appwrite', [
            'endpoint' => 'https://sgp.cloud.appwrite.io/v1',
            'project_id' => 'project-test',
            'api_key' => 'server-key-test',
            'database_id' => 'soc5_outbound',
            'timeout' => 10,
            'tables' => [
                'profiles' => 'profiles', 'sessions' => 'sessions',
                'audit_logs' => 'audit_logs', 'password_resets' => 'password_resets',
            ],
        ]);
    }

    public function test_profile_lookup_uses_server_side_tablesdb_credentials(): void
    {
        Http::fake([
            'https://sgp.cloud.appwrite.io/v1/tablesdb/soc5_outbound/tables/profiles/user-1' => Http::response([
                '$id' => 'user-1', 'name' => 'FTE', 'role' => 'fte_ops', 'is_active' => true,
            ]),
        ]);

        $profile = (new AppwriteService)->profileForUser('user-1');

        $this->assertSame('user-1', $profile['$id']);
        Http::assertSent(function ($request): bool {
            return $request->hasHeader('X-Appwrite-Key', 'server-key-test')
                && $request->header('X-Appwrite-Project')[0] === 'project-test';
        });
    }

    public function test_session_audit_and_password_reset_rows_use_configured_tables(): void
    {
        Http::fake([
            'https://sgp.cloud.appwrite.io/v1/tablesdb/soc5_outbound/tables/*/rows' => Http::sequence()
                ->push(['$id' => 'session-1'])
                ->push(['$id' => 'audit-1'])
                ->push(['$id' => 'reset-1']),
        ]);

        $service = new AppwriteService;
        $service->createSessionRecord(['user_id' => 'user-1'], 'session-1');
        $service->createAuditLog(['event_type' => 'AUTHENTICATED'], 'audit-1');
        $service->createPasswordReset(['user_id' => 'user-1'], 'reset-1');

        Http::assertSentCount(3);
        Http::assertSent(fn ($request): bool => str_contains($request->url(), '/tables/sessions/rows'));
        Http::assertSent(fn ($request): bool => str_contains($request->url(), '/tables/audit_logs/rows'));
        Http::assertSent(fn ($request): bool => str_contains($request->url(), '/tables/password_resets/rows'));
    }

    public function test_all_phase_six_tables_have_metadata_endpoints(): void
    {
        Http::fake([
            'https://sgp.cloud.appwrite.io/v1/tablesdb/soc5_outbound/tables/*' => Http::response(['$id' => 'table']),
        ]);

        $service = new AppwriteService;
        foreach (['profiles', 'sessions', 'audit_logs', 'password_resets'] as $table) {
            $this->assertNotNull($service->getTable($table));
        }

        Http::assertSentCount(4);
    }
}
