<?php

namespace Tests\Unit;

use App\Integrations\SeaTalk\ApprovalItemPayload;
use App\Integrations\SeaTalk\SeaTalkApprovalCenterAdapter;
use App\Integrations\SeaTalk\SeaTalkClient;
use App\Integrations\SeaTalk\SeaTalkProviderException;
use App\Integrations\SeaTalk\SeaTalkTokenProvider;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class SeaTalkApprovalCenterAdapterTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('services.seatalk.approval.app_id', 'app-1');
        config()->set('services.seatalk.approval.app_secret', 'secret-1');
        config()->set('services.seatalk.token_url', 'https://openapi.seatalk.io/auth/app_access_token');
        config()->set('services.seatalk.approval.base_url', 'https://openapi.seatalk.io');
        config()->set('services.seatalk.approval.create_path', '/approval_center/v2/create');
        config()->set('services.seatalk.approval.update_path', '/approval_center/v2/update');
        config()->set('services.seatalk.approval.detail_path', '/approval_center/v2/get');
    }

    public function test_create_maps_required_fields_and_localization_fallback(): void
    {
        Http::fake([
            'https://openapi.seatalk.io/auth/app_access_token' => Http::response(['code' => 0, 'app_access_token' => 'token-1', 'expire_in' => 3600]),
            'https://openapi.seatalk.io/approval_center/v2/create' => Http::response(['code' => 0, 'response_id' => 'provider-1']),
        ]);

        $payload = new ApprovalItemPayload(
            itemId: 'request-1',
            createdAt: 1700000000,
            updatedAt: 1700000000,
            applicantName: 'Applicant',
            title: 'Truck request',
            pendingList: [['employee_code' => 'e-1', 'ts' => 1700000000]],
            approveUrl: 'https://app.test/approve',
            rejectUrl: 'https://app.test/reject',
            statusText: ['zh-hans' => '待处理'],
        );

        $result = (new SeaTalkApprovalCenterAdapter(new SeaTalkClient(new SeaTalkTokenProvider)))->createItem($payload);

        $this->assertSame('provider-1', $result->providerResponseId());
        Http::assertSent(function ($request): bool {
            $data = $request->data();

            return $request->url() === 'https://openapi.seatalk.io/approval_center/v2/create'
                && $data['item_id'] === 'request-1'
                && $data['title'] === ['en' => 'Truck request']
                && $data['pending_list'][0]['employee_code'] === 'e-1';
        });
    }

    public function test_unconfirmed_update_endpoint_fails_closed_without_provider_call(): void
    {
        config()->set('services.seatalk.approval.update_path', null);
        Http::fake();

        $this->expectException(SeaTalkProviderException::class);
        $this->expectExceptionMessage('endpoint is not confirmed');
        (new SeaTalkApprovalCenterAdapter(new SeaTalkClient(new SeaTalkTokenProvider)))->updateItem('provider-1', $this->payload());
        Http::assertNothingSent();
    }

    public function test_invalid_payload_is_rejected_before_provider_call(): void
    {
        Http::fake();
        $payload = $this->payload(itemId: str_repeat('x', 31));

        $this->expectException(SeaTalkProviderException::class);
        $this->expectExceptionMessage('item_id');
        (new SeaTalkApprovalCenterAdapter(new SeaTalkClient(new SeaTalkTokenProvider)))->createItem($payload);
        Http::assertNothingSent();
    }

    public function test_get_item_uses_documented_endpoint_and_returns_provider_item(): void
    {
        Http::fake([
            'https://openapi.seatalk.io/auth/app_access_token' => Http::response(['code' => 0, 'app_access_token' => 'token-1', 'expire_in' => 3600]),
            'https://openapi.seatalk.io/approval_center/v2/get*' => Http::response([
                'code' => 0,
                'item' => ['item_id' => 'request-1', 'status' => ['state' => 0]],
            ]),
        ]);

        $result = (new SeaTalkApprovalCenterAdapter(new SeaTalkClient(new SeaTalkTokenProvider)))
            ->getItem('request-1');

        $this->assertSame('request-1', $result->item()['item_id']);
        Http::assertSent(fn ($request): bool => $request->method() === 'GET'
            && $request->url() === 'https://openapi.seatalk.io/approval_center/v2/get?item_id=request-1');
    }

    private function payload(?string $itemId = null): ApprovalItemPayload
    {
        return new ApprovalItemPayload(
            itemId: $itemId ?? 'request-1',
            createdAt: 1700000000,
            updatedAt: 1700000000,
            applicantName: 'Applicant',
            title: 'Truck request',
            pendingList: [],
            approveUrl: 'https://app.test/approve',
            rejectUrl: 'https://app.test/reject',
        );
    }
}
