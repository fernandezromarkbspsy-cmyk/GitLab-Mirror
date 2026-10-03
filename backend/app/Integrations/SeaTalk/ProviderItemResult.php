<?php

namespace App\Integrations\SeaTalk;

final readonly class ProviderItemResult
{
    public function __construct(public SeaTalkResponse $response) {}

    public function providerResponseId(): ?string
    {
        $id = data_get($this->response->payload, 'response_id') ?? data_get($this->response->payload, 'data.response_id');

        return is_scalar($id) ? (string) $id : null;
    }

    public function item(): ?array
    {
        $item = $this->response->payload['item'] ?? $this->response->payload['data'] ?? null;

        return is_array($item) ? $item : null;
    }
}
