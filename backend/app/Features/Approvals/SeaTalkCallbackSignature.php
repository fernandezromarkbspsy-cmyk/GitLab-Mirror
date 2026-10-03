<?php

namespace App\Features\Approvals;

final class SeaTalkCallbackSignature
{
    public static function verify(string $rawBody, ?string $signature, string $secret): bool
    {
        if ($signature === null || $secret === '' || ! preg_match('/\A[a-f0-9]{64}\z/i', $signature)) {
            return false;
        }

        return hash_equals(hash('sha256', $rawBody.$secret), strtolower($signature));
    }
}
