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
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (config('services.auth.provider', 'supabase') === 'appwrite' && $this->isSupabaseSession($request)) {
            return $this->supabase->handle($request, $next);
        }

        return match (config('services.auth.provider', 'supabase')) {
            'appwrite' => $this->appwrite->handle($request, $next),
            'supabase' => $this->supabase->handle($request, $next),
            default => abort(500, 'Unsupported authentication provider.'),
        };
    }

    private function isSupabaseSession(Request $request): bool
    {
        $token = $request->bearerToken();
        if (! is_string($token)) {
            return (bool) $request->cookie('sb-access-token');
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        $encodedPayload = strtr($parts[1], '-_', '+/');
        $encodedPayload .= str_repeat('=', (4 - strlen($encodedPayload) % 4) % 4);
        $payload = json_decode(base64_decode($encodedPayload, true) ?: '', true);
        $issuer = is_array($payload) && is_string($payload['iss'] ?? null) ? $payload['iss'] : '';
        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        if ($supabaseUrl === '') {
            return false;
        }
        $supabaseIssuer = $supabaseUrl.'/auth/v1';

        return $issuer !== '' && str_starts_with($issuer, $supabaseIssuer);
    }
}
