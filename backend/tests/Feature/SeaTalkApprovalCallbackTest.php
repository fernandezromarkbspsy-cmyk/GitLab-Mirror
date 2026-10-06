<?php

namespace Tests\Feature;

use App\Features\Approvals\ApprovalService;
use App\Features\Approvals\SeaTalkApprovalCallbackController;
use App\Features\Approvals\SeaTalkCallbackSignature;
use App\Features\Requests\RequestAuthorizer;
use App\Features\Requests\RequestRepository;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PDO;
use Tests\TestCase;

final class SeaTalkApprovalCallbackTest extends TestCase
{
    private string $requestId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    private string $profileId = '11111111-1111-1111-1111-111111111111';

    private string $assignmentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for isolated callback tests.');
        }
        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        config()->set('services.seatalk.approval.callback_signing_secret', 'callback-secret');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        $this->createSchema();
    }

    public function test_valid_callback_is_authenticated_replay_safe_and_updates_shared_state(): void
    {
        $payload = $this->payload();
        $controller = new SeaTalkApprovalCallbackController(new ApprovalService(new RequestRepository(new RequestAuthorizer), new RequestAuthorizer));

        $first = $controller->approve($this->request($payload));
        $second = $controller->approve($this->request($payload));

        $this->assertSame(200, $first->getStatusCode());
        $this->assertSame(200, $second->getStatusCode());
        $this->assertSame('REQUESTED', DB::table('requests')->where('id', $this->requestId)->value('status'));
        $this->assertSame('APPROVED', DB::table('requests')->where('id', $this->requestId)->value('approval_status'));
        $this->assertSame('APPROVED', DB::table('seatalk_approval_assignments')->where('id', $this->assignmentId)->value('status'));
        $this->assertSame(1, DB::table('request_events')->count());
        $this->assertSame(1, DB::table('seatalk_callback_events')->count());
        $this->assertSame(
            'processed',
            json_decode($first->getContent(), true, 512, JSON_THROW_ON_ERROR)['status']
        );

        $this->assertSame(
            'duplicate',
            json_decode($second->getContent(), true, 512, JSON_THROW_ON_ERROR)['status']
        );

        $this->assertSame(1, DB::table('notifications')->count());

        $this->assertDatabaseHas('seatalk_callback_events', [
            'status' => 'processed',
            'assignment_id' => $this->assignmentId,
        ]);
    }

    public function test_wrong_employee_is_acknowledged_without_mutating_request(): void
    {
        $payload = $this->payload();
        $payload['employee']['employee_code'] = 'wrong-user';
        $controller = new SeaTalkApprovalCallbackController(new ApprovalService(new RequestRepository(new RequestAuthorizer), new RequestAuthorizer));

        $response = $controller->approve($this->request($payload));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('PENDING', DB::table('requests')->where('id', $this->requestId)->value('status'));
        $this->assertSame(0, DB::table('request_events')->count());
        $this->assertSame(
            'ignored',
            json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR)['status']
        );

        $this->assertDatabaseHas('seatalk_callback_events', [
            'status' => 'ignored',
            'failure_reason' => 'Actor is disabled or not provisioned.',
        ]);

    }

    public function test_signature_uses_raw_body_and_constant_time_comparison_contract(): void
    {
        $raw = '{"item_id":"item-1"}';
        $signature = hash('sha256', $raw.'callback-secret');

        $this->assertTrue(SeaTalkCallbackSignature::verify($raw, $signature, 'callback-secret'));
        $this->assertFalse(SeaTalkCallbackSignature::verify($raw, strtoupper($signature).'x', 'callback-secret'));
        $this->assertFalse(SeaTalkCallbackSignature::verify($raw, null, 'callback-secret'));
    }

    private function request(array $payload): Request
    {
        return Request::create(
            '/api/v1/integrations/seatalk/approval/approve',
            'POST',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload),
        );
    }

    private function payload(): array
    {
        return [
            'item_id' => 'provider-item-1',
            'employee' => ['employee_code' => 'employee-1'],
        ];
    }

    private function createSchema(): void
    {
        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('role');
            $table->boolean('is_active')->default(true);
            $table->string('seatalk_employee_code')->nullable();
        });
        Schema::create('requests', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('status');
            $table->uuid('created_by')->nullable();
            $table->string('rejection_remarks')->nullable();

            $table->string('approval_status')->default('PENDING');
            $table->uuid('approved_by')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->uuid('rejected_by')->nullable();
            $table->dateTime('rejected_at')->nullable();

            $table->string('approval_source')->nullable();
            $table->unsignedBigInteger('approval_version')->default(0);
            $table->uuid('approval_correlation_id')->nullable();
        });
        Schema::create('request_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('request_id');
            $table->uuid('actor_id');
            $table->string('event_type');
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('metadata')->nullable();
        });
        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();
            $table->uuid('request_id');
            $table->uuid('user_id')->nullable();
            $table->string('target_role')->nullable();
            $table->string('event_type');
            $table->string('title');
            $table->text('body');
        });
        Schema::create('seatalk_approval_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('request_id');
            $table->string('provider_item_id')->unique();
        });
        Schema::create('seatalk_approval_assignments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('request_id');
            $table->uuid('fte_user_id');
            $table->string('status');
            $table->text('failure_reason')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->string('provider_response_id')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::create('seatalk_callback_events', function (Blueprint $table): void {
            $table->string('event_id')->primary();
            $table->string('provider_item_id');
            $table->uuid('request_id')->nullable();
            $table->string('employee_code');
            $table->string('action');
            $table->string('status');

            $table->string('payload_hash', 64)->nullable();
            $table->uuid('assignment_id')->nullable();
            $table->text('failure_reason')->nullable();

            $table->uuid('correlation_id')->nullable();
            $table->timestamp('received_at');
            $table->timestamp('processed_at')->nullable();
        });

        DB::table('profiles')->insert([
            'id' => $this->profileId,
            'role' => 'fte_ops',
            'is_active' => true,
            'seatalk_employee_code' => 'employee-1',
        ]);

        DB::table('seatalk_approval_assignments')->insert([
            'id' => $this->assignmentId,
            'request_id' => $this->requestId,
            'fte_user_id' => $this->profileId,
            'status' => 'ACTIVE',
            'expires_at' => now()->addMinutes(5),
        ]);

        DB::table('requests')->insert(['id' => $this->requestId, 'status' => 'PENDING', 'created_by' => $this->profileId]);
        DB::table('seatalk_approval_items')->insert(['id' => 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'request_id' => $this->requestId, 'provider_item_id' => 'provider-item-1']);
    }
}
