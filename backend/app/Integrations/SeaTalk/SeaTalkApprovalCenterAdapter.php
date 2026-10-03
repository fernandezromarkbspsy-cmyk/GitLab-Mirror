<?php

namespace App\Integrations\SeaTalk;

final class SeaTalkApprovalCenterAdapter implements SeaTalkApprovalCenterGateway
{
    public function __construct(private SeaTalkClient $client) {}

    public function createItem(ApprovalItemPayload $payload): ProviderItemResult
    {
        $path = (string) config('services.seatalk.approval.create_path');
        if ($path === '') {
            throw SeaTalkProviderException::contract('SeaTalk create approval-item endpoint is not confirmed/configured.');
        }

        return new ProviderItemResult($this->client->request('POST', $path, $payload->toArray()));
    }

    public function updateItem(string $providerItemId, ApprovalItemPayload $payload): void
    {
        if ($providerItemId === '') {
            throw SeaTalkProviderException::validation('A SeaTalk provider item ID is required for update.');
        }
        $path = (string) config('services.seatalk.approval.update_path');
        if ($path === '') {
            throw SeaTalkProviderException::contract('SeaTalk update approval-item endpoint is not confirmed/configured.');
        }

        $body = $payload->toArray();
        $body['item_id'] = $providerItemId;
        $this->client->request('POST', $path, $body);
    }

    public function getItem(string $providerItemId): ProviderItemResult
    {
        if ($providerItemId === '') {
            throw SeaTalkProviderException::validation('A SeaTalk provider item ID is required for retrieval.');
        }
        $path = (string) config('services.seatalk.approval.detail_path');
        if ($path === '') {
            throw SeaTalkProviderException::contract('SeaTalk get approval-item endpoint is not configured.');
        }

        return new ProviderItemResult($this->client->request('GET', $path, ['item_id' => $providerItemId]));
    }
}
