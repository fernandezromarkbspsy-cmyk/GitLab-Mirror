<?php

use App\Console\Commands\ProvisionBackroomUsers;
use App\Console\Commands\SyncRequestsToGoogleSheet;
use App\Console\Commands\VerifyProductionConfig;
use App\Http\Middleware\AuthenticateSupabase;
use App\Http\Middleware\AuthenticateConfigured;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Console\Scheduling\Schedule;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', health: '/up')
    ->withCommands([ProvisionBackroomUsers::class, SyncRequestsToGoogleSheet::class, VerifyProductionConfig::class])
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('requests:sync-google-sheet')
            ->everyFiveMinutes()
            ->withoutOverlapping();
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'supabase.auth' => AuthenticateSupabase::class,
            'auth.configured' => AuthenticateConfigured::class,
        ]);
        $middleware->prependToPriorityList(ThrottleRequests::class, AuthenticateConfigured::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);
    })
    ->create();
