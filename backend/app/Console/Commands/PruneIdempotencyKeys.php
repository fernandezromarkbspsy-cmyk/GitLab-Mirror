<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

final class PruneIdempotencyKeys extends Command
{
    protected $signature = 'idempotency:prune {--chunk=1000 : Maximum rows to remove per batch}';

    protected $description = 'Delete expired idempotency reservations';

    public function handle(): int
    {
        $chunk = max(1, (int) $this->option('chunk'));
        $deleted = 0;

        do {
            $ids = DB::table('idempotency_keys')
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', now())
                ->orderBy('id')
                ->limit($chunk)
                ->pluck('id');

            if ($ids->isEmpty()) {
                break;
            }

            $deleted += DB::table('idempotency_keys')->whereIn('id', $ids)->delete();
        } while (true);

        $this->info("Deleted {$deleted} expired idempotency key(s).");

        return self::SUCCESS;
    }
}
