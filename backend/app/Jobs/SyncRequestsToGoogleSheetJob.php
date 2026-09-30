<?php

namespace App\Jobs;

use App\Integrations\GoogleSheets\GoogleSheetsRequestSync;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncRequestsToGoogleSheetJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 5;

    public int $timeout = 90;

    public function handle(GoogleSheetsRequestSync $sync): void
    {
        if (! config('services.google_sheets.sync_enabled')) {
            return;
        }

        $sync->sync();
    }
}
