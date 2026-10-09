<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

final class VerifySessionCsrf
{
    public function handle(Request $request, Closure $next): Response
    {
        $session = $request->session();
        $token = (string) $session->token();

        if ($session->has('seatalk_profile_id') && ! $request->isMethodSafe()) {
            $provided = (string) ($request->header('X-XSRF-TOKEN') ?: $request->input('_token'));
            abort_unless($provided !== '' && hash_equals($token, rawurldecode($provided)), 419, 'CSRF token mismatch.');
        }

        $response = $next($request);
        $response->headers->setCookie(Cookie::create(
            'XSRF-TOKEN', rawurlencode((string) $session->token()), 0, '/', null,
            (bool) config('session.secure'), false, false, config('session.same_site', 'lax')
        ));

        return $response;
    }
}
