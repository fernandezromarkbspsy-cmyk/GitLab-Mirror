<?php

namespace Tests\Feature;

use App\Features\Kpi\KpiController;
use App\Features\Requests\RequestAuthorizer;
use App\Features\Requests\RequestRepository;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/** @group postgres */
final class PostgresReportingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (getenv('POSTGRES_TESTS') !== '1' || ! in_array('pgsql', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('PostgreSQL integration tests are enabled only in the PostgreSQL CI job.');
        }

        config()->set('app.business_timezone', 'Asia/Manila');
        config()->set('database.default', 'pgsql');
        DB::purge('pgsql');
        DB::reconnect('pgsql');
        Schema::dropIfExists('requests');
        Schema::create('requests', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->timestampTz('request_timestamp');
            $table->string('cluster');
            $table->string('region');
            $table->string('dock_no');
            $table->integer('backlogs');
            $table->timestampTz('backlogs_timestamp')->nullable();
            $table->string('ob_fte')->nullable();
            $table->string('truck_size');
            $table->string('truck_type');
            $table->string('plate_number')->nullable();
            $table->timestampTz('provide_time')->nullable();
            $table->string('linehaul_trip_no')->nullable();
            $table->timestampTz('docked_time')->nullable();
            $table->string('status');
            $table->text('rejection_remarks')->nullable();
            $table->string('driver_id')->nullable();
            $table->uuid('created_by');
            $table->timestampTz('approved_at')->nullable();
            $table->timestampTz('rejected_at')->nullable();
            $table->timestampTz('confirmed_at')->nullable();
            $table->timestampTz('created_at')->nullable();
            $table->timestampTz('updated_at')->nullable();
        });
    }

    protected function tearDown(): void
    {
        if (getenv('POSTGRES_TESTS') === '1' && in_array('pgsql', \PDO::getAvailableDrivers(), true)) {
            Schema::dropIfExists('requests');
        }

        parent::tearDown();
    }

    public function test_daily_reporting_uses_manila_calendar_boundaries(): void
    {
        DB::table('requests')->insert([
            [
                'id' => '00000000-0000-0000-0000-000000000001',
                'request_timestamp' => '2026-09-18 15:59:59+00',
                'status' => 'CONFIRMED',
            ],
            [
                'id' => '00000000-0000-0000-0000-000000000002',
                'request_timestamp' => '2026-09-18 16:00:00+00',
                'status' => 'CONFIRMED',
            ],
        ]);

        $request = Request::create('/api/kpi/daily', 'GET', ['date_from' => '2026-09-19', 'date_to' => '2026-09-19']);
        $request->attributes->set('actor', (object) ['role' => 'fte_ops']);
        $response = (new KpiController)->daily($request)->getData(true);

        $this->assertCount(1, $response['data']);
        $this->assertSame('2026-09-19', $response['data'][0]['date']);
        $this->assertSame(1, (int) $response['data'][0]['total']);
    }

    public function test_request_date_filter_keeps_timestamp_predicate_indexable(): void
    {
        $queries = [];
        DB::listen(static function ($query) use (&$queries): void {
            $queries[] = $query->sql;
        });

        $repository = new RequestRepository(new RequestAuthorizer);
        $repository->paginate((object) ['role' => 'fte_mm'], [
            'date_from' => '2026-09-19',
            'date_to' => '2026-09-19',
            'per_page' => 20,
        ]);

        $requestQuery = collect($queries)->first(fn (string $sql): bool => str_contains($sql, 'from "requests"'));
        $this->assertNotNull($requestQuery);
        $this->assertStringNotContainsString('AT TIME ZONE', $requestQuery);
        $this->assertStringContainsString('request_timestamp', $requestQuery);
    }
}
