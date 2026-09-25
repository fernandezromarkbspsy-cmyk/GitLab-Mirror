<?php

namespace Tests\Feature;

use App\Features\Requests\RequestAuthorizer;
use App\Features\Requests\RequestRepository;
use App\Features\Requests\RequestService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PDO;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

final class RequestWorkflowTest extends TestCase
{
    private RequestRepository $repository;

    private RequestService $service;

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for isolated request workflow tests.');
        }
        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        $this->createSchema();
        $authorizer = new RequestAuthorizer;
        $this->repository = new RequestRepository($authorizer);
        $this->service = new RequestService($this->repository, $authorizer);
    }

    public function test_fte_ops_can_edit_a_pending_request(): void
    {
        $request = $this->insertRequest(['status' => 'PENDING']);
        $actor = (object) ['id' => (string) Str::uuid(), 'role' => 'fte_ops'];

        $updated = $this->service->updateDetails($request->id, $actor, [
            'cluster' => 'SOC 6',
            'region' => 'NCR',
            'dock_no' => 'D-12',
            'backlogs' => 42,
            'truck_size' => '10W',
            'truck_type' => 'DRYLEASE',
        ]);

        $this->assertSame('SOC 6', $updated->cluster);
        $this->assertDatabaseHas('request_events', ['request_id' => $request->id, 'event_type' => 'REQUEST_EDITED']);
    }

    public function test_fte_ops_rejection_cancels_the_request(): void
    {
        $request = $this->insertRequest(['status' => 'PENDING']);
        $actor = (object) ['id' => (string) Str::uuid(), 'role' => 'fte_ops'];

        $updated = $this->service->transition($request->id, $actor, 'reject-ops', []);

        $this->assertSame('CANCELLED', $updated->status);
        $this->assertDatabaseHas('request_events', ['request_id' => $request->id, 'event_type' => 'REQUEST_REJECTED_BY_OPS']);
    }

    public function test_request_list_filters_by_plate_and_date(): void
    {
        $this->insertRequest(['plate_number' => 'ABC-1234', 'request_timestamp' => '2026-06-15 08:00:00']);
        $this->insertRequest(['plate_number' => 'XYZ-9000', 'request_timestamp' => '2026-05-10 08:00:00']);
        $actor = (object) ['id' => (string) Str::uuid(), 'role' => 'fte_mm'];

        $result = $this->repository->paginate($actor, [
            'search' => 'abc',
            'date_from' => '2026-06-01',
            'date_to' => '2026-06-30',
            'sort' => 'plate_number',
            'direction' => 'asc',
            'per_page' => 20,
        ]);

        $this->assertSame(1, $result->total());
        $this->assertSame('ABC-1234', $result->items()[0]->plate_number);
    }

    public function test_analytics_applies_date_filters(): void
    {
        $this->insertRequest(['truck_size' => '4W', 'request_timestamp' => '2026-06-15 08:00:00']);
        $this->insertRequest(['truck_size' => '10W', 'request_timestamp' => '2026-05-15 08:00:00']);
        $actor = (object) ['id' => (string) Str::uuid(), 'role' => 'fte_mm'];

        $result = $this->repository->analytics($actor, [
            'date_from' => '2026-06-01',
            'date_to' => '2026-06-30',
        ]);

        $this->assertSame(1, (int) $result['truck_sizes']['4W']);
        $this->assertArrayNotHasKey('10W', $result['truck_sizes']->all());
    }

    public function test_non_postgres_date_filters_use_the_business_timezone(): void
    {
        config()->set('app.business_timezone', 'Asia/Manila');
        $this->insertRequest(['request_timestamp' => '2026-05-31 16:30:00']);
        $actor = (object) ['id' => (string) Str::uuid(), 'role' => 'fte_mm'];

        $result = $this->repository->paginate($actor, [
            'date_from' => '2026-06-01',
            'date_to' => '2026-06-01',
        ]);

        $this->assertSame(1, $result->total());
    }

    public function test_docking_assignment_notifies_doc_officer(): void
    {
        $request = $this->insertRequest(['status' => 'APPROVED']);
        $actor = (object) ['id' => (string) Str::uuid(), 'role' => 'fte_mm'];

        $this->service->transition($request->id, $actor, 'assign-truck', ['plate_number' => 'ABC-123']);

        $this->assertDatabaseHas('notifications', ['request_id' => $request->id, 'target_role' => 'doc_officer']);
        $this->assertDatabaseHas('request_events', [
            'request_id' => $request->id,
            'event_type' => 'TRUCK_ASSIGNED',
            'from_status' => 'APPROVED',
            'to_status' => 'ASSIGNED',
        ]);
        $this->assertDatabaseHas('request_events', [
            'request_id' => $request->id,
            'event_type' => 'TRUCK_FOR_DOCKING',
            'from_status' => 'ASSIGNED',
            'to_status' => 'FOR_DOCKING',
        ]);
        $this->assertSame('FOR_DOCKING', DB::table('requests')->where('id', $request->id)->value('status'));
    }

    public function test_request_becomes_docked_only_after_driver_and_trip_are_present(): void
    {
        $docOfficer = (object) ['id' => (string) Str::uuid(), 'role' => 'doc_officer'];
        $opsPic = (object) ['id' => (string) Str::uuid(), 'role' => 'ops_pic'];
        $request = $this->insertRequest(['status' => 'FOR_DOCKING', 'created_by' => $opsPic->id]);

        $this->service->transition($request->id, $docOfficer, 'mark-docked', ['driver_id' => 'DRV-1']);
        $this->assertSame('FOR_DOCKING', DB::table('requests')->where('id', $request->id)->value('status'));

        $this->service->transition($request->id, $opsPic, 'mark-docked', ['linehaul_trip_no' => 'LH-1']);
        $this->assertSame('DOCKED', DB::table('requests')->where('id', $request->id)->value('status'));
        $this->assertDatabaseHas('request_events', [
            'request_id' => $request->id,
            'event_type' => 'TRUCK_DOCKED',
            'from_status' => 'FOR_DOCKING',
            'to_status' => 'DOCKED',
        ]);
    }

    public function test_non_owner_ops_pic_cannot_mark_request_docked(): void
    {
        $request = $this->insertRequest(['status' => 'FOR_DOCKING', 'created_by' => (string) Str::uuid()]);
        $opsPic = (object) ['id' => (string) Str::uuid(), 'role' => 'ops_pic'];

        try {
            $this->service->transition($request->id, $opsPic, 'mark-docked', ['linehaul_trip_no' => 'LH-1']);
            $this->fail('A non-owner Ops PIC should not be able to dock the request.');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }

        $this->assertNull(DB::table('requests')->where('id', $request->id)->value('linehaul_trip_no'));
    }

    public function test_transition_ignores_fields_owned_by_another_workflow_step(): void
    {
        $request = $this->insertRequest(['status' => 'DOCKED', 'truck_type' => 'WETLEASE', 'driver_id' => 'DRV-1', 'linehaul_trip_no' => 'LH-1']);
        $docOfficer = (object) ['id' => (string) Str::uuid(), 'role' => 'doc_officer'];

        $updated = $this->service->transition($request->id, $docOfficer, 'confirm', ['truck_type' => 'DRYLEASE']);

        $this->assertSame('CONFIRMED', $updated->status);
        $this->assertSame('WETLEASE', $updated->truck_type);
    }

    public function test_disallowed_docking_field_cannot_complete_the_transition(): void
    {
        $opsPic = (object) ['id' => (string) Str::uuid(), 'role' => 'ops_pic'];
        $request = $this->insertRequest(['status' => 'FOR_DOCKING', 'created_by' => $opsPic->id]);

        $updated = $this->service->transition($request->id, $opsPic, 'mark-docked', [
            'linehaul_trip_no' => 'LH-1',
            'driver_id' => 'DRV-INJECTED',
        ]);

        $this->assertSame('FOR_DOCKING', $updated->status);
        $this->assertSame('LH-1', $updated->linehaul_trip_no);
        $this->assertNull($updated->driver_id);
    }

    public function test_injected_confirmation_fields_cannot_bypass_docking_requirements(): void
    {
        $request = $this->insertRequest(['status' => 'DOCKED']);
        $docOfficer = (object) ['id' => (string) Str::uuid(), 'role' => 'doc_officer'];

        try {
            $this->service->transition($request->id, $docOfficer, 'confirm', [
                'driver_id' => 'DRV-INJECTED',
                'linehaul_trip_no' => 'LH-INJECTED',
            ]);
            $this->fail('Disallowed confirmation fields should not satisfy docking requirements.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('driver_id', $exception->errors());
        }

        $this->assertSame('DOCKED', DB::table('requests')->where('id', $request->id)->value('status'));
    }

    private function insertRequest(array $overrides = []): object
    {
        $id = (string) Str::uuid();
        DB::table('requests')->insert(array_merge([
            'id' => $id,
            'request_timestamp' => '2026-06-30 08:00:00',
            'cluster' => 'SOC 5',
            'region' => 'NCR',
            'dock_no' => 'D-01',
            'backlogs' => 10,
            'truck_size' => '6W',
            'truck_type' => 'WETLEASE',
            'plate_number' => null,
            'status' => 'PENDING',
            'created_by' => (string) Str::uuid(),
            'created_at' => '2026-06-30 08:00:00',
            'updated_at' => '2026-06-30 08:00:00',
        ], $overrides));

        return DB::table('requests')->where('id', $id)->first();
    }

    private function createSchema(): void
    {
        Schema::create('requests', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->dateTime('request_timestamp');
            $table->string('cluster');
            $table->string('region');
            $table->string('dock_no');
            $table->integer('backlogs');
            $table->dateTime('backlogs_timestamp')->nullable();
            $table->string('ob_fte')->nullable();
            $table->string('truck_size');
            $table->string('truck_type');
            $table->string('plate_number')->nullable();
            $table->dateTime('provide_time')->nullable();
            $table->string('linehaul_trip_no')->nullable();
            $table->dateTime('docked_time')->nullable();
            $table->string('status');
            $table->text('rejection_remarks')->nullable();
            $table->string('driver_id')->nullable();
            $table->uuid('created_by');
            $table->dateTime('approved_at')->nullable();
            $table->dateTime('rejected_at')->nullable();
            $table->dateTime('confirmed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('request_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('request_id');
            $table->string('event_type');
            $table->uuid('actor_id')->nullable();
            $table->string('from_status')->nullable();
            $table->string('to_status')->nullable();
            $table->text('metadata');
            $table->timestamps();
        });
        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();
            $table->uuid('request_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->string('target_role')->nullable();
            $table->string('event_type');
            $table->string('title');
            $table->text('body');
            $table->timestamps();
        });
    }
}
