<?php

namespace App\Integrations\SeaTalk;

use RuntimeException;

final class SeaTalkProviderException extends RuntimeException
{
    public const AUTHENTICATION = 'authentication';

    public const PERMISSION = 'permission';

    public const VALIDATION = 'validation';

    public const RATE_LIMIT = 'rate_limit';

    public const TRANSIENT = 'transient';

    public const CONTRACT = 'contract';

    public function __construct(
        string $message,
        public readonly string $category,
        public readonly int $httpStatus = 0,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $httpStatus, $previous);
    }

    public static function contract(string $message): self
    {
        return new self($message, self::CONTRACT);
    }

    public static function validation(string $message): self
    {
        return new self($message, self::VALIDATION, 422);
    }
}
