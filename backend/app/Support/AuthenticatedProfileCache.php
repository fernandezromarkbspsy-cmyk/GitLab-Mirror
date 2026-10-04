<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class AuthenticatedProfileCache
{
    private const COLUMNS = [
        'id', 'name', 'role', 'email', 'ops_id', 'must_change_password',
        'password_reset_at', 'password_changed_at', 'created_at',
    ];

    public static function findActive(string $id): ?object
    {
        $ttl = (int) config('services.supabase.profile_cache_ttl', 5);
        $profile = $ttl > 0
            ? Cache::remember(self::key($id), now()->addSeconds($ttl), static fn (): ?object => self::query($id))
            : self::query($id);

        // Cache stores may retain object references in-process. The middleware
        // adds request-specific role fields, so never mutate the cached object.
        return $profile === null ? null : clone $profile;
    }

    public static function forget(string $id): void
    {
        Cache::forget(self::key($id));
    }

    private static function query(string $id): ?object
    {
        return DB::table('profiles')
            ->where('id', $id)
            ->where('is_active', true)
            ->first(self::COLUMNS);
    }

    private static function key(string $id): string
    {
        return 'authenticated-profile:'.$id;
    }
}
