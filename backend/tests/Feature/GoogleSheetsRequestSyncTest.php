<?php

namespace Tests\Feature;

use App\Integrations\GoogleSheets\GoogleSheetsRequestSync;
use Google\Service\Sheets;
use Google\Service\Sheets\Resource\SpreadsheetsValues;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery;
use RuntimeException;
use Tests\TestCase;

final class GoogleSheetsRequestSyncTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for Google Sheets sync tests.');
        }

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        config()->set('services.google_sheets.spreadsheet_id', 'test-sheet');
        config()->set('services.google_sheets.sheet_name', 'Sheet1');
        config()->set('services.google_sheets.max_rows', 100);
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
        });
        Schema::create('requests', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->timestamp('request_timestamp');
            $table->string('cluster');
            $table->string('region');
            $table->string('dock_no');
            $table->integer('backlogs');
            $table->timestamp('backlogs_timestamp')->nullable();
            $table->string('truck_size');
            $table->string('truck_type');
            $table->string('plate_number')->nullable();
            $table->timestamp('provide_time')->nullable();
            $table->string('linehaul_trip_no')->nullable();
            $table->timestamp('docked_time')->nullable();
            $table->uuid('created_by');
        });
        Schema::create('request_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('request_id');
            $table->string('event_type');
            $table->timestamp('created_at');
            $table->text('metadata')->nullable();
            $table->uuid('actor_id')->nullable();
        });

        DB::table('profiles')->insert(['id' => 'creator-id', 'name' => 'Ops PIC']);
        DB::table('requests')->insert([
            'id' => 'request-id',
            'request_timestamp' => now(),
            'cluster' => 'SOC 5',
            'region' => 'NCR',
            'dock_no' => 'D-1',
            'backlogs' => 10,
            'truck_size' => '6W',
            'truck_type' => 'WETLEASE',
            'created_by' => 'creator-id',
        ]);
    }

    public function test_failed_update_never_clears_existing_sheet_values(): void
    {
        $values = Mockery::mock(SpreadsheetsValues::class);
        $values->shouldReceive('update')->once()->andThrow(new RuntimeException('update failed'));
        $values->shouldNotReceive('batchClear');
        $sheets = Mockery::mock(Sheets::class);
        $sheets->spreadsheets_values = $values;
        $sync = new GoogleSheetsRequestSync(fn (): Sheets => $sheets);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('update failed');

        $sync->sync();
    }

    public function test_successful_update_clears_only_stale_values_afterward(): void
    {
        $values = Mockery::mock(SpreadsheetsValues::class);
        $values->shouldReceive('update')->once()->ordered();
        $values->shouldReceive('batchClear')->once()->ordered();
        $sheets = Mockery::mock(Sheets::class);
        $sheets->spreadsheets_values = $values;
        $sync = new GoogleSheetsRequestSync(fn (): Sheets => $sheets);

        $this->assertSame(1, $sync->sync());
    }

    public function test_google_sheets_timeout_configuration_has_bounded_defaults(): void
    {
        $this->assertSame(5.0, (float) config('services.google_sheets.connect_timeout'));
        $this->assertSame(30.0, (float) config('services.google_sheets.timeout'));
    }
}
