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

    public function forAuthenticatedUser(string $authUserId, ?string $provider = null): ?object
    {
        if ($this->usesAppwrite($provider)) {
            return $this->normalizeAppwriteProfile($this->appwrite->profileForUser($authUserId), $authUserId);
        }

        return $this->sqlProfileQuery()
            ->where('id', $authUserId)
            ->where('is_active', true)
            ->first();
    }

    public function activeBackroomByOpsId(string $opsId): ?object
    {
        if ($this->usesAppwrite()) {
            $profile = $this->appwrite->profilesByOpsId($opsId)[0] ?? null;

            return $profile && ($profile['role'] ?? null) === 'ops_pic' && ($profile['is_active'] ?? false)
                ? $this->normalizeAppwriteProfile($profile, (string) ($profile['$id'] ?? $profile['id'] ?? ''))
                : null;
        }

        return $this->sqlProfileQuery()
            ->whereRaw('lower(ops_id) = ?', [strtolower($opsId)])
            ->where('role', 'ops_pic')
            ->where('is_active', true)
            ->first(['id', 'must_change_password']);
    }

    public function appwriteBackroomByOpsId(string $opsId): ?array
    {
        if (! $this->usesAppwrite()) {
            return null;
        }

        return $this->appwrite->profilesByOpsId(strtolower($opsId))[0] ?? null;
    }

    public function markAppwritePasswordResetCompleted(string $profileId, string $timestamp): array
    {
        return $this->appwrite->updateRow('profiles', $profileId, [
            'must_change_password' => false,
            'password_changed_at' => $timestamp,
            'password_reset_at' => $timestamp,
        ]);
    }

    public function markAppwritePasswordResetRequired(string $profileId, string $timestamp): array
    {
        return $this->appwrite->updateRow('profiles', $profileId, [
            'must_change_password' => true,
            'password_changed_at' => null,
            'password_reset_at' => $timestamp,
        ]);
    }

    public function all(): array
    {
        if ($this->usesAppwrite()) {
            return $this->appwrite->profiles();
        }

        return DB::table('profiles')->select('id', 'name', 'role', 'email', 'ops_id', 'is_active', 'created_at')->orderBy('name')->get()->all();
    }

    public function createAppwriteProfile(string $userId, array $data): array
    {
        return $this->appwrite->createRow('profiles', $data, $userId);
    }

    public function updateAppwriteProfile(string $userId, array $data): array
    {
        return $this->appwrite->updateRow('profiles', $userId, $data);
    }

    public function markPasswordChanged(string $profileId, ?string $provider = null): int
    {
        $data = [
            'must_change_password' => false,
            'password_changed_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ];

        if ($this->usesAppwrite($provider)) {
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

    private function usesAppwrite(?string $provider = null): bool
    {
        return ($provider ?? config('services.auth.provider')) === 'appwrite';
    }
}
