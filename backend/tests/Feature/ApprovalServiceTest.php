<?php

namespace Tests\Feature;

use App\Features\Approvals\ApprovalActor;
use App\Features\Approvals\ApprovalService;
use App\Features\Approvals\ApprovalSource;
use App\Features\Requests\RequestAuthorizer;
use App\Features\Requests\RequestRepository;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use PDO;
use Tests\TestCase;

final class ApprovalServiceTest extends TestCase
{
    private ApprovalService $service;

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for isolated approval tests.');
        }

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        $this->createSchema();

        $authorizer = new RequestAuthorizer;
        $this->service = new ApprovalService(new RequestRepository($authorizer), $authorizer);
    }

    public function test_web_approval_records_canonical_metadata_once(): void
    {
        $request = $this->insertRequest('PENDING');
        $actor = new ApprovalActor((string) Str::uuid(), 'fte_ops');
        $this->insertApprovalProfile($actor);

        $first = $this->service->approve($request, $actor, ApprovalSource::Web);
        $second = $this->service->approve($request, $actor, ApprovalSource::Web);

        $this->assertFalse($first->idempotent);
        $this->assertTrue($second->idempotent);
        $this->assertSame('REQUESTED', DB::table('requests')->where('id', $request)->value('status'));
        $this->assertSame('APPROVED', DB::table('requests')->where('id', $request)->value('approval_status'));
        $this->assertSame('WEB', DB::table('requests')->where('id', $request)->value('approval_source'));
        $this->assertSame(1, (int) DB::table('requests')->where('id', $request)->value('approval_version'));
        $this->assertSame(1, DB::table('request_events')->count());
    }

    public function test_rejection_requires_reason_and_closes_active_assignments(): void
    {
        $request = $this->insertRequest('REQUESTED');
        $assignmentId = (string) Str::uuid();
        $actor = new ApprovalActor((string) Str::uuid(), 'fte_mm', 'employee-1');
        $this->insertApprovalProfile($actor);
        DB::table('seatalk_approval_assignments')->insert([
            'id' => $assignmentId,
            'request_id' => $request,
            'fte_user_id' => $actor->id,
            'status' => 'ACTIVE',
        ]);

        $result = $this->service->reject(
            $request,
            $actor,
            ApprovalSource::SeaTalk,
            $assignmentId,
            'No truck available',
        );

        $this->assertSame('CANCELLED', $result->request->status);
        $this->assertSame('REJECTED', DB::table('requests')->where('id', $request)->value('approval_status'));
        $this->assertSame('REJECTED', DB::table('seatalk_approval_assignments')->where('request_id', $request)->value('status'));
        $this->assertNull(DB::table('seatalk_approval_assignments')->where('request_id', $request)->value('failure_reason'));
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
            $table->string('rejection_remarks')->nullable();
            $table->uuid('created_by')->nullable();
            $table->string('approval_status')->default('PENDING');
            $table->uuid('approved_by')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->string('approval_source')->nullable();
            $table->uuid('rejected_by')->nullable();
            $table->dateTime('rejected_at')->nullable();
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
            $table->string('target_role')->nullable();
            $table->uuid('user_id')->nullable();
            $table->string('event_type');
            $table->string('title');
            $table->text('body');
        });
        Schema::create('seatalk_approval_assignments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('request_id');
            $table->uuid('fte_user_id');
            $table->string('status');
            $table->text('failure_reason')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->dateTime('responded_at')->nullable();
            $table->dateTime('updated_at')->nullable();
        });
    }

    private function insertRequest(string $status): string
    {
        $id = (string) Str::uuid();
        DB::table('requests')->insert(['id' => $id, 'status' => $status]);

        return $id;
    }

    private function insertApprovalProfile(ApprovalActor $actor): void
    {
        DB::table('profiles')->insert([
            'id' => $actor->id,
            'role' => $actor->role,
            'is_active' => true,
            'seatalk_employee_code' => $actor->employeeCode,
        ]);
    }
}
