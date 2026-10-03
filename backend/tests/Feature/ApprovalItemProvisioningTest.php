<?php

namespace Tests\Feature;

use App\Features\Approvals\ApprovalItemProvisioner;
use App\Integrations\SeaTalk\ApprovalItemPayload;
use App\Integrations\SeaTalk\ProviderItemResult;
use App\Integrations\SeaTalk\SeaTalkApprovalCenterGateway;
use App\Integrations\SeaTalk\SeaTalkProviderException;
use App\Integrations\SeaTalk\SeaTalkResponse;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Mockery;
use PDO;
use Tests\TestCase;

final class ApprovalItemProvisioningTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for isolated provisioning tests.');
        }

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        config()->set('services.seatalk.approval.enabled', true);
        config()->set('services.seatalk.approval.approve_callback_url', 'https://app.test/approve');
        config()->set('services.seatalk.approval.reject_callback_url', 'https://app.test/reject');
        config()->set('services.seatalk.approval.app_path', 'seatalk://application/sop/soc5/?itemId={itemId}');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        $this->createSchema();
    }

    public function test_provisioning_uses_stable_identity_and_records_provider_success(): void
    {
        $requestId = '11111111-1111-1111-1111-111111111111';
        $profileId = '22222222-2222-2222-2222-222222222222';
        DB::table('profiles')->insert([
            'id' => $profileId,
            'name' => 'FTE Operator',
            'role' => 'fte_ops',
            'is_active' => true,
            'seatalk_employee_code' => 'employee-1',
        ]);
        DB::table('requests')->insert([
            'id' => $requestId,
            'created_by' => $profileId,
            'cluster' => 'SOC 5',
            'dock_no' => 'D-1',
            'created_at' => '2026-10-03 00:00:00',
        ]);
        $request = DB::table('requests')->where('id', $requestId)->first();
        $adapter = Mockery::mock(SeaTalkApprovalCenterGateway::class);
        $adapter->expects('createItem')->with(Mockery::on(function (ApprovalItemPayload $payload): bool {
            return $payload->itemId === 'req_11111111111111111111111111'
                && $payload->pendingList[0]['employee_code'] === 'employee-1'
                && $payload->appPath === 'seatalk://application/sop/soc5/?itemId=req_11111111111111111111111111'
                && is_int($payload->pendingList[0]['ts']);
        }))->andReturn(new ProviderItemResult(new SeaTalkResponse(200, ['code' => 0, 'response_id' => 'response-1'])));

        $result = (new ApprovalItemProvisioner($adapter))->provisionForRequest($request);

        $this->assertTrue($result->delivered());
        $this->assertSame('req_11111111111111111111111111', DB::table('seatalk_approval_items')->value('provider_item_id'));
        $this->assertSame('ACTIVE', DB::table('seatalk_approval_items')->value('status'));
        $this->assertSame('response-1', DB::table('seatalk_approval_items')->value('provider_response_id'));
    }

    public function test_provider_failure_is_recorded_without_changing_request_state(): void
    {
        $requestId = (string) Str::uuid();
        DB::table('requests')->insert(['id' => $requestId, 'created_at' => now()]);
        $request = DB::table('requests')->where('id', $requestId)->first();
        $adapter = Mockery::mock(SeaTalkApprovalCenterGateway::class);
        $adapter->expects('createItem')->andThrow(SeaTalkProviderException::contract('endpoint not confirmed'));

        $result = (new ApprovalItemProvisioner($adapter))->provisionForRequest($request);

        $this->assertSame('failed', $result->status);
        $this->assertSame('FAILED', DB::table('seatalk_approval_items')->value('status'));
        $this->assertSame('PENDING', DB::table('requests')->value('status'));
    }

    private function createSchema(): void
    {
        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('role');
            $table->boolean('is_active')->default(true);
            $table->string('seatalk_employee_code')->nullable();
        });
        Schema::create('requests', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('created_by')->nullable();
            $table->string('cluster')->nullable();
            $table->string('dock_no')->nullable();
            $table->string('status')->default('PENDING');
            $table->timestamp('created_at')->nullable();
        });
        Schema::create('seatalk_approval_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('request_id')->unique();
            $table->string('provider_item_id')->nullable();
            $table->string('provider_response_id')->nullable();
            $table->string('status')->default('PENDING');
            $table->text('failure_reason')->nullable();
            $table->uuid('correlation_id')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }
}
