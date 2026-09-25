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
            $attempts = max(1, (int) config('services.google_sheets.retry_attempts', 3));
            $backoffMilliseconds = max(0, (int) config('services.google_sheets.retry_backoff_ms', 1000));
            $count = 0;

            for ($attempt = 1; $attempt <= $attempts; $attempt++) {
                try {
                    $count = $sync->sync();
                    break;
                } catch (Throwable $exception) {
                    if ($attempt === $attempts) {
                        throw $exception;
                    }

                    usleep($backoffMilliseconds * (2 ** ($attempt - 1)) * 1000);
                }
            }

            $this->info("Synchronized {$count} request(s) to Google Sheets.");

            return self::SUCCESS;
        } catch (Throwable $exception) {
            report($exception);
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}
