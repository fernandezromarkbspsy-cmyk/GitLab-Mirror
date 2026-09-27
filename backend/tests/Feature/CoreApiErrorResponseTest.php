<?php

namespace Tests\Feature;

use Tests\TestCase;

final class CoreApiErrorResponseTest extends TestCase
{
    public function test_api_errors_use_a_standard_response_shape_and_request_id(): void
    {
        $this->getJson('/api/auth/me', [
            'X-Request-Id' => 'phase1-error-test',
        ])
            ->assertUnauthorized()
            ->assertJson([
                'message' => 'Authentication required.',
                'request_id' => 'phase1-error-test',
            ]);
    }
}
