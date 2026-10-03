<?php

namespace App\Features\Approvals;

final readonly class ApprovalActor
{
    public function __construct(
        public string $id,
        public string $role,
        public ?string $employeeCode = null,
    ) {}

    public static function fromObject(object $actor): self
    {
        return new self(
            (string) $actor->id,
            (string) ($actor->role ?? ''),
            isset($actor->employee_code) ? (string) $actor->employee_code : null,
        );
    }
}
