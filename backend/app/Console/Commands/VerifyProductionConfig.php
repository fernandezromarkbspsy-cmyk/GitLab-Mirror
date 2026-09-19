<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

final class VerifyProductionConfig extends Command
{
    protected $signature = 'system:verify-config {--production : Apply production-only requirements}';

    protected $description = 'Verify required application configuration before startup or deployment';

    public function handle(): int
    {
        $required = [
            'APP_KEY' => config('app.key'),
            'APP_URL' => config('app.url'),
            'SUPABASE_URL' => config('services.supabase.url'),
            'SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY' => config('services.supabase.anon_key'),
            'SUPABASE_SERVICE_ROLE_KEY' => config('services.supabase.service_key'),
            'ADMIN_EMAILS' => config('services.admin_emails'),
            'DB_HOST' => config('database.connections.pgsql.host'),
            'DB_USERNAME' => config('database.connections.pgsql.username'),
            'DB_PASSWORD' => config('database.connections.pgsql.password'),
        ];

        $failed = false;
        foreach ($required as $name => $value) {
            if (blank($value)) {
                $this->error("Missing required configuration: {$name}");
                $failed = true;
            }
        }

        if (config('services.google_sheets.sync_enabled')) {
            $credentialsConfigured = filled(config('services.google_sheets.credentials_json'))
                || filled(config('services.google_sheets.credentials_path'));
            if (! filled(config('services.google_sheets.spreadsheet_id')) || ! $credentialsConfigured) {
                $this->error('Google Sheets sync is enabled but its spreadsheet ID or credentials are missing.');
                $failed = true;
            }
            if ((int) config('services.google_sheets.max_rows') < 1) {
                $this->error('GOOGLE_SHEETS_MAX_ROWS must be at least 1.');
                $failed = true;
            }
        }

        if ($this->option('production')) {
            if (config('app.env') !== 'production') {
                $this->error('APP_ENV must be production for a production deployment.');
                $failed = true;
            }
            if (config('app.debug')) {
                $this->error('APP_DEBUG must be false in production.');
                $failed = true;
            }
            if (! in_array(config('database.connections.pgsql.sslmode'), ['require', 'verify-ca', 'verify-full'], true)) {
                $this->error('DB_SSLMODE must enforce TLS in production.');
                $failed = true;
            }
            if (! str_starts_with((string) config('app.url'), 'https://')) {
                $this->error('APP_URL must use HTTPS in production.');
                $failed = true;
            }
        }

        if ($failed) {
            return self::FAILURE;
        }

        $this->info('Application configuration is valid.');

        return self::SUCCESS;
    }
}
