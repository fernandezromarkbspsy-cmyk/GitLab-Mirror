<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

final class RetryUserEvents extends Command
{
    protected $signature = 'audit:retry-user-events';

    protected $description = 'Retry user audit events that were queued after a write failure';

    public function handle(): int
    {
        $retries = DB::table('user_event_retries')
            ->where('available_at', '<=', now())
            ->orderBy('id')
            ->limit(100)
            ->get();

        foreach ($retries as $retry) {
            try {
                DB::table('user_events')->insert([
                    'user_id' => $retry->user_id,
                    'actor_id' => $retry->actor_id,
                    'event_type' => $retry->event_type,
                    'metadata' => $retry->metadata,
                ]);
                DB::table('user_event_retries')->where('id', $retry->id)->delete();
            } catch (\Throwable $exception) {
                DB::table('user_event_retries')->where('id', $retry->id)->update([
                    'attempts' => $retry->attempts + 1,
                    'available_at' => now()->addMinutes(min(60, 2 ** min($retry->attempts, 5))),
                    'last_error' => $exception->getMessage(),
                    'updated_at' => now(),
                ]);
                $this->error('Audit retry failed for event '.$retry->id.': '.$exception->getMessage());
            }
        }

        return self::SUCCESS;
    }
}
