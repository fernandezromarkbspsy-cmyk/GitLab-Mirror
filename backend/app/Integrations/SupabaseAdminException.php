<?php

namespace App\Integrations;

use RuntimeException;
use Throwable;

final class SupabaseAdminException extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 0, ?Throwable $previous = null)
    {
        parent::__construct($message, $status, $previous);
    }
}
