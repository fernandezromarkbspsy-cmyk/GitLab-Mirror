<?php

namespace App\Integrations\SeaTalk;

interface SeaTalkApprovalCenterGateway
{
    public function createItem(ApprovalItemPayload $payload): ProviderItemResult;

    public function updateItem(string $providerItemId, ApprovalItemPayload $payload): void;

    public function getItem(string $providerItemId): ProviderItemResult;
}
