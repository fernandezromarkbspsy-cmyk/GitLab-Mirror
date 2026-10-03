<?php

namespace App\Features\Approvals;

final readonly class ApprovalResult
{
    public function __construct(
        public object $request,
        public bool $accepted,
        public bool $idempotent = false,
    ) {}
}
