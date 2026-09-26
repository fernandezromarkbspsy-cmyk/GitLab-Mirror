<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SystemVerifyConfig extends Command
{
    protected $signature = 'system:verify-config --production';

    protected $description = 'Verify that the necessary production tables are present';

    public function handle()
    {
        if ($this->isProduction()) {
            // ... existing code ...
            $requiredTables = [
                'user_events',
                'idempotency_keys',
            ];

            foreach ($requiredTables as $table) {
                if (! DB::connection('production')->hasTable($table)) {
                    $this->error("Required production table is missing: $table");

                    return;
                }
            }

            $this->info('All required production tables are present.');
        } else {
            $this->info('This command is only intended for use in production environment.');
        }
    }

    private function isProduction()
    {
        // ... existing code ...
        return env('APP_ENV') === 'production';
    }
}
