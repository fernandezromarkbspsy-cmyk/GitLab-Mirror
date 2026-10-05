<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class VerifySessionOrigin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (
            ! $request->hasSession()
            || ! $request->session()->has('seatalk_profile_id')
            || in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)
        ) {
            return $next($request);
        }

        $originHeader = $request->headers->get('Origin');
        $sourceOrigin = filled($originHeader)
            ? $this->originOf($originHeader)
            : $this->originOf($request->headers->get('Referer'));
        $allowedOrigins = array_filter([
            $this->originOf($request->getSchemeAndHttpHost()),
            $this->originOf(config('app.frontend_url')),
        ]);

        abort_unless(
            $sourceOrigin !== null && in_array($sourceOrigin, $allowedOrigins, true),
            403,
            'Cross-origin session request blocked.'
        );

        return $next($request);
    }

    private function originOf(?string $url): ?string
    {
        if (! filled($url)) {
            return null;
        }

        try {
            $parts = parse_url($url);
        } catch (\ValueError) {
            return null;
        }

        if (
            ! is_array($parts)
            || ! isset($parts['scheme'], $parts['host'])
            || ! in_array(strtolower($parts['scheme']), ['http', 'https'], true)
            || isset($parts['user'])
            || isset($parts['pass'])
        ) {
            return null;
        }

        $scheme = strtolower($parts['scheme']);
        $host = strtolower($parts['host']);
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return $scheme.'://'.$host.$port;
    }
}
