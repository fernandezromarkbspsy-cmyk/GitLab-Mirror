<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class AuthenticateConfigured
{
    public function __construct(
        private readonly AuthenticateSupabase $supabase,
        private readonly AuthenticateAppwrite $appwrite,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        return match (config('services.auth.provider', 'supabase')) {
            'appwrite' => $this->appwrite->handle($request, $next),
            'supabase' => $this->supabase->handle($request, $next),
            default => abort(500, 'Unsupported authentication provider.'),
        };
    }
}
