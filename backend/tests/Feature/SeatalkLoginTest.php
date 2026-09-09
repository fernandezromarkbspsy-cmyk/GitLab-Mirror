<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SeatalkLoginTest extends TestCase
{
    public function test_qr_transaction_completes_after_the_seatalk_callback(): void
    {
        config()->set('services.seatalk', [
            'app_id' => 'seatalk-test-app',
            'app_secret' => 'seatalk-test-secret',
            'redirect_uri' => 'https://seatalk-dev.soc5outboundops.app/api/auth/seatalk/callback',
        ]);
        config()->set('services.supabase', [
            'url' => 'https://test-project.supabase.co',
            'service_key' => 'test-service-key',
            'http_proxy' => '',
            'ca_bundle' => '',
        ]);
        Cache::forget('seatalk:app-access-token');

        Http::fake([
            'https://openapi.seatalk.io/auth/app_access_token' => Http::response([
                'code' => 0,
                'app_access_token' => 'test-token',
                'expire' => now()->addHour()->timestamp,
            ]),
            'https://openapi.seatalk.io/open_login/code2employee*' => Http::response([
                'code' => 0,
                'employee' => [
                    'employee_code' => 'EMP-1',
                    'name' => 'Test Employee',
                    'email' => 'test.employee@spxexpress.com',
                ],
            ]),
            'https://test-project.supabase.co/auth/v1/admin/generate_link' => Http::response([
                'action_link' => 'https://test-project.supabase.co/auth/v1/verify?token=test-token&type=email&redirect_to=https%3A%2F%2Fseatalk-dev.soc5outboundops.app%2F',
            ]),
        ]);

        $transaction = $this->postJson('/api/auth/seatalk/transactions')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->json();

        parse_str((string) parse_url($transaction['login_url'], PHP_URL_QUERY), $query);

        $this->get('/api/auth/seatalk/callback?code=test-code&state='.$query['state'])
            ->assertOk()
            ->assertSee('SeaTalk login complete');

        $this->withHeader('X-Seatalk-Transaction', $transaction['transaction_token'])
            ->getJson('/api/auth/seatalk/transactions/'.$transaction['transaction_id'])
            ->assertOk()
            ->assertJsonPath('status', 'complete')
            ->assertJsonPath('employee.email', 'test.employee@spxexpress.com')
            ->assertJsonPath('session_url', 'https://test-project.supabase.co/auth/v1/verify?token=test-token&type=email&redirect_to=https%3A%2F%2Fseatalk-dev.soc5outboundops.app%2F');

        Http::assertSentCount(3);
    }
}
