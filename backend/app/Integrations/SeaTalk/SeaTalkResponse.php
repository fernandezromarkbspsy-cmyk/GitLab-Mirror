<?php

namespace App\Integrations\SeaTalk;

final readonly class SeaTalkResponse
{
    public function __construct(
        public int $status,
        public array $payload,
        public array $headers = [],
    ) {}

    public function code(): ?int
    {
        return isset($this->payload['code']) ? (int) $this->payload['code'] : null;
    }
}
