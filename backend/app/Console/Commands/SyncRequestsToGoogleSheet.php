<?php

namespace App\Console\Commands;

use App\Integrations\GoogleSheets\GoogleSheetsRequestSync;
use Illuminate\Console\Command;
use Throwable;

final class SyncRequestsToGoogleSheet extends Command
{
    protected $signature = 'requests:sync-google-sheet';

    protected $description = 'Mirror request records to the configured Google Sheet';

    public function handle(GoogleSheetsRequestSync $sync): int
    {
        if (! config('services.google_sheets.sync_enabled')) {
            $this->line('Google Sheets sync is disabled.');

            return self::SUCCESS;
        }

        try {
            $count = $sync->sync();
            $this->info("Synchronized {$count} request(s) to Google Sheets.");

            return self::SUCCESS;
        } catch (Throwable $exception) {
            report($exception);
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}
