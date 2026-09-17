<?php

namespace App\Features\Users;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Services\AppwriteService;
use App\Services\ProfileRepository;
use Throwable;

final class UserController
{
    private readonly AppwriteService $appwrite;

    private readonly ProfileRepository $profiles;

    public function __construct(
        ?AppwriteService $appwrite = null,
        ?ProfileRepository $profiles = null,
    ) {
        $this->appwrite = $appwrite ?? app(AppwriteService::class);
        $this->profiles = $profiles ?? app(ProfileRepository::class);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize($request);

        if ($this->usesAppwrite()) {
            return response()->json(['data' => array_map(fn (array $profile): array => $this->appwriteProfileResponse($profile), $this->profiles->all())]);
        }

        return response()->json(['data' => DB::table('profiles')->select('id', 'name', 'role', 'email', 'ops_id', 'is_active', 'created_at')->orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $actor = $request->attributes->get('actor');
        abort_unless(in_array($actor->role, ['fte_ops', 'fte_mm'], true), 403, 'Only FTE users can create Backroom accounts.');

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'ops_id' => ['required', 'string', 'max:40', 'regex:/^ops[0-9]+$/i'],
        ]);
        $opsId = strtolower($data['ops_id']);
        $email = $opsId.'@backroom.soc5.internal';

        if ($this->usesAppwrite()) {
            abort_if(count($this->appwrite->profilesByOpsId($opsId)) > 0, 422, 'A Backroom account with this Ops ID already exists.');

            $initialPassword = Str::password(20);
            $user = $this->appwrite->createAuthUser($email, $initialPassword, $data['name']);
            abort_unless($user && ($user['$id'] ?? $user['id'] ?? null), 422, 'Unable to create authentication account.');

            return $this->storeWithAppwrite($data, $opsId, $email, $request->attributes->get('actor'), $user, $initialPassword);
        }

        $data = $request->validate(['ops_id' => [Rule::unique('profiles', 'ops_id')]]) + $data;
        $url = rtrim((string) config('services.supabase.url'), '/');
        $key = (string) config('services.supabase.service_key');
        abort_if($url === '' || $key === '', 503, 'Backroom provisioning is not configured.');

        $initialPassword = Str::password(20);
        $response = Http::withHeaders(['apikey' => $key, 'Authorization' => 'Bearer '.$key])
            ->timeout(10)->post($url.'/auth/v1/admin/users', [
                'email' => $email,
                'password' => $initialPassword,
                'email_confirm' => true,
                'user_metadata' => ['ops_id' => $opsId, 'account_type' => 'backroom'],
            ]);
        if (! $response->successful() || ! $response->json('id')) {
            Log::warning('Unable to create Supabase Backroom user.', [
                'status' => $response->status(),
                'ops_id' => $opsId,
            ]);
            abort(422, 'Unable to create authentication account.');
        }

        $authUserId = $response->json('id');

        try {
            $profile = DB::transaction(function () use ($authUserId, $data, $opsId) {
                $profile = DB::table('profiles')->insertGetId([
                    'id' => $authUserId, 'name' => $data['name'], 'role' => 'ops_pic',
                    'ops_id' => $opsId, 'email' => null, 'is_active' => true,
                    'must_change_password' => true, 'password_reset_at' => now(), 'created_at' => now(), 'updated_at' => now(),
                ], 'id');

                if (DB::getSchemaBuilder()->hasTable('user_imports')) {
                    DB::table('user_imports')->whereRaw('lower(ops_id) = ?', [$opsId])->update([
                        'auth_user_id' => $authUserId,
                        'imported_at' => now(),
                    ]);
                }

                return $profile;
            });
        } catch (Throwable $exception) {
            Http::withHeaders(['apikey' => $key, 'Authorization' => 'Bearer '.$key])
                ->timeout(10)->delete($url.'/auth/v1/admin/users/'.$authUserId);
            throw $exception;
        }

        $this->userEvent($profile, $actor->id, 'USER_CREATED', ['name' => $data['name'], 'ops_id' => $opsId]);

        return response()->json([
            'id' => $profile,
            'name' => $data['name'],
            'ops_id' => $opsId,
            'must_change_password' => true,
            'initial_password' => $initialPassword,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $this->authorize($request);
        abort_if($request->attributes->get('actor')->id === $id, 409, 'You cannot change your own role.');
        $data = $request->validate(['name' => 'required|string|min:2|max:120', 'role' => ['required', Rule::in(['ops_pic', 'fte_ops', 'fte_mm', 'doc_officer'])]]);

        if ($this->usesAppwrite()) {
            abort_unless($this->appwrite->profileForUser($id), 404, 'User not found.');
            try {
                $this->appwrite->updateAuthUser($id, ['name' => $data['name']]);
                $profile = $this->profiles->updateAppwriteProfile($id, $data);
            } catch (Throwable $exception) {
                report($exception);
                abort(503, 'Unable to update the Backroom account.');
            }
            $this->userEvent($id, $request->attributes->get('actor')->id, 'USER_UPDATED', $data);

            return response()->json($this->appwriteProfileResponse($profile));
        }

        $updated = DB::table('profiles')->where('id', $id)->update($data + ['updated_at' => now()]);
        abort_unless($updated, 404, 'User not found.');
        $this->userEvent($id, $request->attributes->get('actor')->id, 'USER_UPDATED', $data);

        return response()->json(DB::table('profiles')->where('id', $id)->firstOrFail());
    }

    public function disable(Request $request, string $id): JsonResponse
    {
        return $this->setActive($request, $id, false);
    }

    public function activate(Request $request, string $id): JsonResponse
    {
        return $this->setActive($request, $id, true);
    }

    private function setActive(Request $request, string $id, bool $isActive): JsonResponse
    {
        $this->authorize($request);
        abort_if($request->attributes->get('actor')->id === $id, 409, 'You cannot disable your own account.');

        if ($this->usesAppwrite()) {
            abort_unless($this->appwrite->profileForUser($id), 404, 'User not found.');
            try {
                $this->appwrite->setAuthUserStatus($id, $isActive);
                $this->profiles->updateAppwriteProfile($id, ['is_active' => $isActive, 'updated_at' => now()->toISOString()]);
                if (! $isActive) {
                    $this->appwrite->revokeAllUserSessions($id);
                }
            } catch (Throwable $exception) {
                report($exception);
                abort(503, 'Unable to update the Backroom account status.');
            }
            $this->userEvent($id, $request->attributes->get('actor')->id, $isActive ? 'USER_ENABLED' : 'USER_DISABLED');

            return response()->json(['ok' => true]);
        }

        $updated = DB::table('profiles')->where('id', $id)->update(['is_active' => $isActive, 'updated_at' => now()]);
        abort_unless($updated, 404, 'User not found.');
        $this->userEvent($id, $request->attributes->get('actor')->id, $isActive ? 'USER_ENABLED' : 'USER_DISABLED');

        return response()->json(['ok' => true]);
    }

    public function resetPassword(Request $request, string $id): JsonResponse
    {
        $this->authorize($request);

        if ($this->usesAppwrite()) {
            return $this->resetPasswordWithAppwrite($request, $id);
        }

        $profile = DB::table('profiles')->where('id', $id)->where('role', 'ops_pic')->where('is_active', true)->first(['id', 'ops_id', 'must_change_password', 'password_changed_at', 'password_reset_at']);
        abort_unless($profile, 404, 'Active Backroom user not found.');

        $url = rtrim((string) config('services.supabase.url'), '/');
        $key = (string) config('services.supabase.service_key');
        abort_if($url === '' || $key === '', 503, 'Backroom provisioning is not configured.');

        $newPassword = Str::password(20);
        $resetAt = now();
        DB::table('profiles')->where('id', $profile->id)->update([
            'must_change_password' => true,
            'password_changed_at' => null,
            'password_reset_at' => $resetAt,
            'updated_at' => $resetAt,
        ]);

        $restoreResetState = function () use ($profile): void {
            $restored = DB::table('profiles')->where('id', $profile->id)->update([
                'must_change_password' => $profile->must_change_password,
                'password_changed_at' => $profile->password_changed_at,
                'password_reset_at' => $profile->password_reset_at,
                'updated_at' => now(),
            ]);
            if (! $restored) {
                Log::critical('Backroom password reset rollback failed.', ['user_id' => $profile->id, 'ops_id' => $profile->ops_id]);
            }
        };

        try {
            $response = Http::withHeaders(['apikey' => $key, 'Authorization' => 'Bearer '.$key])
                ->withOptions(['proxy' => config('services.supabase.http_proxy') ?: false])
                ->withOptions(['verify' => config('services.supabase.ca_bundle') ?: true])
                ->timeout(10)
                ->put($url.'/auth/v1/admin/users/'.$profile->id, ['password' => $newPassword]);
        } catch (Throwable $exception) {
            $restoreResetState();
            Log::warning('Unable to reach Supabase during Backroom password reset.', ['user_id' => $profile->id, 'error' => $exception->getMessage()]);
            abort(502, 'Unable to reset the Backroom password.');
        }

        if (! $response->successful()) {
            $restoreResetState();
            abort(502, 'Unable to reset the Backroom password.');
        }
        $this->userEvent($profile->id, $request->attributes->get('actor')->id, 'PASSWORD_RESET', ['ops_id' => $profile->ops_id]);

        return response()->json(['ok' => true, 'initial_password' => $newPassword]);
    }

    public function requestPasswordReset(Request $request): JsonResponse
    {
        $data = $request->validate(['ops_id' => ['required', 'string', 'max:40', 'regex:/^ops[0-9]+$/i']]);
        $message = 'If the account exists, recovery instructions have been sent.';

        if (! $this->usesAppwrite()) {
            return response()->json(['ok' => true, 'message' => $message], 202);
        }

        try {
            $profile = $this->profiles->appwriteBackroomByOpsId($data['ops_id']);
            if ($profile && ($profile['role'] ?? null) === 'ops_pic' && ($profile['is_active'] ?? false)) {
                $requestedAt = now()->toISOString();
                if ($this->appwrite->createRecovery((string) ($profile['email'] ?? strtolower($data['ops_id']).'@backroom.soc5.internal'), (string) config('app.url').'/appwrite-recovery')) {
                    $this->appwrite->createPasswordReset([
                        'user_id' => (string) ($profile['$id'] ?? $profile['id']),
                        'actor_id' => null,
                        'requested_at' => $requestedAt,
                        'status' => 'requested',
                        'reason' => 'self-service-recovery',
                        'metadata' => json_encode(['provider' => 'appwrite'], JSON_THROW_ON_ERROR),
                        'completed_at' => null,
                    ]);
                }
            }
        } catch (Throwable $exception) {
            report($exception);
        }

        return response()->json(['ok' => true, 'message' => $message], 202);
    }

    public function completePasswordReset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'string', 'max:100'],
            'secret' => ['required', 'string', 'max:2000'],
            'password' => ['required', 'string', 'min:12', 'max:200', 'confirmed'],
        ]);

        if (! $this->usesAppwrite()) {
            abort(404, 'Password recovery is unavailable.');
        }

        try {
            $profile = $this->appwrite->profileForUser($data['user_id']);
            abort_unless($profile && ($profile['role'] ?? null) === 'ops_pic', 422, 'Recovery link is invalid or expired.');
            abort_unless($this->appwrite->completeRecovery($data['user_id'], $data['secret'], $data['password']), 422, 'Recovery link is invalid or expired.');

            $completedAt = now()->toISOString();
            $this->profiles->markAppwritePasswordResetCompleted($data['user_id'], $completedAt);
            $reset = $this->appwrite->passwordResetForUser($data['user_id']);
            if ($reset) {
                $this->appwrite->updateRow('password_resets', (string) ($reset['$id'] ?? $reset['id']), [
                    'status' => 'completed',
                    'completed_at' => $completedAt,
                ]);
            } else {
                $this->appwrite->createPasswordReset([
                    'user_id' => $data['user_id'],
                    'actor_id' => null,
                    'requested_at' => $completedAt,
                    'status' => 'completed',
                    'reason' => 'recovery-completed',
                    'metadata' => json_encode(['provider' => 'appwrite'], JSON_THROW_ON_ERROR),
                    'completed_at' => $completedAt,
                ]);
            }
        } catch (Throwable $exception) {
            report($exception);
            abort(422, 'Recovery link is invalid or expired.');
        }

        return response()->json(['ok' => true]);
    }

    private function resetPasswordWithAppwrite(Request $request, string $id): JsonResponse
    {
        $profile = $this->appwrite->profileForUser($id);
        abort_unless($profile && ($profile['role'] ?? null) === 'ops_pic' && ($profile['is_active'] ?? false), 404, 'Active Backroom user not found.');

        $newPassword = Str::password(20);
        $resetAt = now()->toISOString();
        try {
            $this->appwrite->updateAuthUserPassword($id, $newPassword);
            $this->profiles->markAppwritePasswordResetRequired($id, $resetAt);
            $this->appwrite->createPasswordReset([
                'user_id' => $id,
                'actor_id' => (string) $request->attributes->get('actor')->id,
                'requested_at' => $resetAt,
                'status' => 'requested',
                'reason' => 'admin-reset',
                'metadata' => json_encode(['provider' => 'appwrite'], JSON_THROW_ON_ERROR),
                'completed_at' => null,
            ]);
        } catch (Throwable $exception) {
            report($exception);
            abort(502, 'Unable to reset the Backroom password.');
        }

        return response()->json(['ok' => true, 'initial_password' => $newPassword]);
    }

    private function authorize(Request $request): void
    {
        abort_unless(in_array($request->attributes->get('actor')->role, ['fte_ops', 'fte_mm'], true), 403, 'Only FTE users can manage users.');
    }

    private function storeWithAppwrite(array $data, string $opsId, string $email, object $actor, array $user, string $initialPassword): JsonResponse
    {
        try {
            $authUserId = (string) ($user['$id'] ?? $user['id']);
            $profile = $this->profiles->createAppwriteProfile($authUserId, [
                'ops_id' => $opsId,
                'name' => $data['name'],
                'email' => $email,
                'role' => 'ops_pic',
                'is_active' => true,
                'must_change_password' => true,
                'password_changed_at' => null,
                'password_reset_at' => now()->toISOString(),
            ]);
        } catch (Throwable $exception) {
            report($exception);
            abort(503, 'Unable to provision the Backroom account.');
        }

        $this->userEvent($authUserId, (string) $actor->id, 'USER_CREATED', ['name' => $data['name'], 'ops_id' => $opsId]);

        return response()->json([
            'id' => $authUserId,
            'name' => $data['name'],
            'ops_id' => $opsId,
            'must_change_password' => true,
            'initial_password' => $initialPassword,
        ], 201);
    }

    private function appwriteProfileResponse(array $profile): array
    {
        return array_merge($profile, ['id' => $profile['id'] ?? $profile['$id'] ?? null]);
    }

    private function usesAppwrite(): bool
    {
        return config('services.auth.provider') === 'appwrite';
    }

    private function userEvent(string $userId, string $actorId, string $type, array $metadata = []): void
    {
        if ($this->usesAppwrite()) {
            return;
        }

        if (DB::getSchemaBuilder()->hasTable('user_events')) {
            DB::table('user_events')->insert(['user_id' => $userId, 'actor_id' => $actorId, 'event_type' => $type, 'metadata' => json_encode($metadata)]);
        }
    }
}
