<?php

namespace App\Features\Approvals;

final readonly class RoutingResult
{
    public function __construct(
        public string $status,
        public ?string $requestId = null,
        public ?string $assignmentId = null,
        public ?string $profileId = null,
        public ?string $failureReason = null,
    ) {}

    public function assigned(): bool
    {
        return $this->status === 'assigned';
    }
}
