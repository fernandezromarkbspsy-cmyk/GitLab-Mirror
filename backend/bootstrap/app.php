<?php

use App\Console\Commands\ProvisionBackroomUsers;
use App\Console\Commands\PruneIdempotencyKeys;
use App\Console\Commands\SentryTest;
use App\Console\Commands\SyncRequestsToGoogleSheet;
use App\Console\Commands\VerifyProductionConfig;
use App\Http\Middleware\AuthenticateSupabase;
use App\Http\Middleware\IdempotencyMiddleware;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', health: '/up')
    ->withCommands([
        ProvisionBackroomUsers::class,
        PruneIdempotencyKeys::class,
        SyncRequestsToGoogleSheet::class,
        VerifyProductionConfig::class,
        SentryTest::class,
    ])
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('requests:sync-google-sheet')
            ->everyFiveMinutes()
            ->withoutOverlapping();
        $schedule->command('idempotency:prune')->hourly()->withoutOverlapping();
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'supabase.auth' => AuthenticateSupabase::class,
            'idempotency' => IdempotencyMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);
    })
    ->create();
