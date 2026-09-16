<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use RuntimeException;
use Sentry\Severity;

class SentryTest extends Command
{
    protected $signature = 'sentry:test';

    protected $description = 'Send a deliberate test message to Sentry';

    public function handle(): int
    {
        $dsn = (string) config('sentry.dsn');

        if ($dsn === '') {
            $this->error('Sentry DSN is not configured. Set SENTRY_LARAVEL_DSN first.');
            return self::FAILURE;
        }

        \Sentry\captureMessage('SOC5 Outbound Sentry test event', Severity::info());
        \Sentry\flush(2.0);

        $this->info('Sentry test event submitted. Check the configured Sentry project.');
        return self::SUCCESS;
    }
}
