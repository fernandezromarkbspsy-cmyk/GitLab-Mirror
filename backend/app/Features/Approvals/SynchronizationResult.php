<?php

namespace App\Features\Approvals;

final readonly class SynchronizationResult
{
    public function __construct(
        public string $status,
        public ?string $failureReason = null,
    ) {}

    public function synchronized(): bool
    {
        return $this->status === 'synchronized';
    }
}
