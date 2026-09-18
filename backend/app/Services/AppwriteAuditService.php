<?php

namespace App\Services;

use Illuminate\Http\Request;
use Throwable;

final class AppwriteAuditService
{
    private const METADATA_KEYS = ['reason', 'mode', 'role', 'source', 'result', 'provider'];

    private const EVENT_TYPES = [
        'login_success', 'login_failed', 'logout', 'session_revoked', 'session_rejected',
        'user_created', 'user_updated', 'user_enabled', 'user_disabled',
        'password_changed', 'password_reset_requested', 'password_reset_completed', 'admin_password_reset',
        'unauthorized_access', 'invalid_recovery', 'expired_recovery', 'reused_recovery',
    ];

    public function __construct(private readonly AppwriteService $appwrite)
    {
    }

    public function record(
        string $eventType,
        ?string $userId = null,
        ?string $actorId = null,
        ?string $targetId = null,
        ?Request $request = null,
        array $metadata = [],
    ): void {
        if (config('services.auth.provider') !== 'appwrite' || ! in_array($eventType, self::EVENT_TYPES, true)) {
            return;
        }

        try {
            $safeMetadata = [];
            foreach ($metadata as $key => $value) {
                if (! in_array((string) $key, self::METADATA_KEYS, true)) {
                    continue;
                }
                $safeMetadata[$key] = is_scalar($value) || $value === null ? $value : (string) json_encode($value, JSON_THROW_ON_ERROR);
            }

            $this->appwrite->createAuditLog([
                'event_type' => $eventType,
                'user_id' => $userId,
                'actor_id' => $actorId,
                'target_id' => $targetId,
                'auth_provider' => 'appwrite',
                'ip' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
                'metadata' => json_encode($safeMetadata, JSON_THROW_ON_ERROR),
                'created_at' => now()->toISOString(),
            ]);
        } catch (Throwable) {
            logger()->warning('Appwrite audit write failed', ['event_type' => $eventType]);
        }
    }
}
