<?php

namespace Tests\Feature;

use App\Integrations\SupabaseHttpOptions;
use Tests\TestCase;

final class SupabaseHttpOptionsTest extends TestCase
{
    public function test_empty_proxy_is_omitted_from_guzzle_options(): void
    {
        config()->set('services.supabase.http_proxy', '');

        $this->assertSame([], SupabaseHttpOptions::guzzle());
    }

    public function test_configured_proxy_is_passed_as_a_string(): void
    {
        config()->set('services.supabase.http_proxy', 'http://proxy.example.test:8080');

        $this->assertSame(
            ['proxy' => 'http://proxy.example.test:8080'],
            SupabaseHttpOptions::guzzle(),
        );
    }
}
