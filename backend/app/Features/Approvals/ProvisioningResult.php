<?php

namespace App\Features\Approvals;

final readonly class ProvisioningResult
{
    public function __construct(
        public string $status,
        public ?string $itemId = null,
        public ?string $providerItemId = null,
        public ?string $failureReason = null,
    ) {}

    public function delivered(): bool
    {
        return $this->status === 'delivered';
    }
}
