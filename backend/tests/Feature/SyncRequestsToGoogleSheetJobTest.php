<?php

namespace Tests\Feature;

use App\Integrations\GoogleSheets\GoogleSheetsRequestSync;
use App\Jobs\SyncRequestsToGoogleSheetJob;
use Mockery;
use Tests\TestCase;

final class SyncRequestsToGoogleSheetJobTest extends TestCase
{
    public function test_job_runs_google_sheets_sync_when_enabled(): void
    {
        config()->set('services.google_sheets.sync_enabled', true);

        $sync = Mockery::mock(GoogleSheetsRequestSync::class);
        $sync->shouldReceive('sync')
            ->once()
            ->andReturn(1);

        $job = new SyncRequestsToGoogleSheetJob;

        $job->handle($sync);
    }

    public function test_job_does_not_sync_when_disabled(): void
    {
        config()->set('services.google_sheets.sync_enabled', false);

        $sync = Mockery::mock(GoogleSheetsRequestSync::class);
        $sync->shouldNotReceive('sync');

        $job = new SyncRequestsToGoogleSheetJob;

        $job->handle($sync);
    }
}
