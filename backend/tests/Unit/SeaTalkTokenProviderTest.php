<?php

namespace Tests\Unit;

use App\Integrations\SeaTalk\SeaTalkProviderException;
use App\Integrations\SeaTalk\SeaTalkTokenProvider;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class SeaTalkTokenProviderTest extends TestCase
{
    public function test_token_is_cached_with_expiry_skew_and_secret_is_not_sent_to_logs(): void
    {
        config()->set('services.seatalk.approval.app_id', 'app-1');
        config()->set('services.seatalk.approval.app_secret', 'secret-1');
        config()->set('services.seatalk.token_url', 'https://openapi.seatalk.io/auth/app_access_token');
        Http::fake([
            'https://openapi.seatalk.io/auth/app_access_token' => Http::response([
                'code' => 0,
                'app_access_token' => 'token-1',
                'expire_in' => 3600,
            ]),
        ]);

        $provider = new SeaTalkTokenProvider;
        $this->assertSame('token-1', $provider->token());
        $this->assertSame('token-1', $provider->token());
        Http::assertSentCount(1);
        $this->assertSame('token-1', Cache::get('seatalk.approval.app-access-token.'.hash('sha256', 'app-1')));
    }

    public function test_missing_credentials_fail_closed(): void
    {
        config()->set('services.seatalk.approval.app_id', null);
        config()->set('services.seatalk.approval.app_secret', null);
        Http::fake();

        $this->expectException(SeaTalkProviderException::class);
        $this->expectExceptionMessage('credentials are not configured');
        (new SeaTalkTokenProvider)->token();
        Http::assertNothingSent();
    }
}
