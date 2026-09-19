<?php

namespace App\Integrations;

final class SupabaseHttpOptions
{
    public static function guzzle(): array
    {
        $proxy = trim((string) config('services.supabase.http_proxy'));

        return $proxy === '' ? [] : ['proxy' => $proxy];
    }
}
