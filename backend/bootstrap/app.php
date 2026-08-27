<?php

use App\Console\Commands\ProvisionBackroomUsers;
use App\Http\Middleware\AuthenticateSupabase;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', health: '/up')
    ->withCommands([ProvisionBackroomUsers::class])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['supabase.auth' => AuthenticateSupabase::class]);
        $middleware->prependToPriorityList(ThrottleRequests::class, AuthenticateSupabase::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);
    })
    ->create();
