<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        RateLimiter::for('api-ip', fn (Request $request) => Limit::perMinute(600)->by('api-ip|'.$request->ip()));
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->attributes->get('actor')?->id ?? $request->ip())
        );
        RateLimiter::for('backroom', fn (Request $request) => [
            Limit::perMinute(20)->by('backroom-ip|'.$request->ip()),
            Limit::perMinute(5)->by('backroom-id|'.$request->ip().'|'.strtolower(trim((string) $request->input('ops_id')))),
        ]);
    }
}
