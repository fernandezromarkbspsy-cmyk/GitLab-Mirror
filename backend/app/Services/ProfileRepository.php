<?php

namespace App\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

final class ProfileRepository
{
    private const PROFILE_COLUMNS = [
        'id', 'name', 'role', 'email', 'ops_id', 'is_active', 'must_change_password',
        'password_reset_at', 'password_changed_at', 'created_at',
    ];

    public function __construct(private readonly AppwriteService $appwrite)
    {
    }

    public function forAuthenticatedUser(string $authUserId): ?object
    {
        if ($this->usesAppwrite()) {
            return $this->normalizeAppwriteProfile($this->appwrite->profileForUser($authUserId), $authUserId);
        }

        return $this->sqlProfileQuery()
            ->where('id', $authUserId)
            ->where('is_active', true)
            ->first();
    }

    public function activeBackroomByOpsId(string $opsId): ?object
    {
        return $this->sqlProfileQuery()
            ->whereRaw('lower(ops_id) = ?', [strtolower($opsId)])
            ->where('role', 'ops_pic')
            ->where('is_active', true)
            ->first(['id', 'must_change_password']);
    }

    public function markPasswordChanged(string $profileId): int
    {
        $data = [
            'must_change_password' => false,
            'password_changed_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ];

        if ($this->usesAppwrite()) {
            $this->appwrite->updateRow('profiles', $profileId, $data);

            return 1;
        }

        return DB::table('profiles')
            ->where('id', $profileId)
            ->where('must_change_password', true)
            ->update([
                'must_change_password' => false,
                'password_changed_at' => now(),
                'updated_at' => now(),
            ]);
    }

    private function sqlProfileQuery(): Builder
    {
        return DB::table('profiles')->select(self::PROFILE_COLUMNS);
    }

    private function normalizeAppwriteProfile(?array $profile, string $authUserId): ?object
    {
        if ($profile === null) {
            return null;
        }

        return (object) array_merge($profile, [
            'id' => $profile['id'] ?? $profile['$id'] ?? $authUserId,
        ]);
    }

    private function usesAppwrite(): bool
    {
        return config('services.auth.provider') === 'appwrite';
    }
}
