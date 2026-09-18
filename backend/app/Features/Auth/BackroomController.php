<?php

namespace App\Features\Auth;

use App\Services\AppwriteService;
use App\Services\ProfileRepository;
use App\Services\AppwriteAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;
use Appwrite\AppwriteException;

final class BackroomController
{
    public function __construct(
        private readonly AppwriteService $appwrite,
        private readonly ProfileRepository $profiles,
        private readonly AppwriteAuditService $audit,
    )
    {
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ops_id' => ['required', 'string', 'max:40', 'regex:/^ops[0-9]+$/i'],
            'password' => ['required', 'string', 'max:200'],
            'mode' => ['sometimes', 'string', 'in:first-login,normal'],
        ]);
        $opsId = strtolower(trim($data['ops_id']));

        if (config('services.auth.provider') === 'appwrite') {
            return $this->loginWithAppwrite($request, $opsId, $data['password'], $data['mode'] ?? null);
        }

        $profile = $this->profiles->activeBackroomByOpsId($opsId);

        abort_unless($profile, 404, 'Ops ID was not found or is inactive.');
        if (($data['mode'] ?? null) === 'first-login') {
            abort_unless($profile->must_change_password, 409, 'This account has already completed first login.');
        }

        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $anonKey = (string) config('services.supabase.anon_key');
        abort_if($supabaseUrl === '' || $anonKey === '', 503, 'Backroom login is not configured.');

        $tokenResponse = Http::withHeaders(['apikey' => $anonKey])
            ->withOptions(['proxy' => config('services.supabase.http_proxy') ?: false])
            ->withOptions(['verify' => config('services.supabase.ca_bundle') ?: true])
            ->connectTimeout(5)
            ->timeout(10)
            ->post($supabaseUrl.'/auth/v1/token?grant_type=password', [
                'email' => $opsId.'@backroom.soc5.internal',
                'password' => $data['password'],
            ]);
        abort_unless($tokenResponse->successful() && $tokenResponse->json('access_token'), 401, 'Invalid Ops ID or password.');

        return response()->json($tokenResponse->json());
    }

    public function logout(Request $request): JsonResponse
    {
        if (config('services.auth.provider') !== 'appwrite') {
            return response()->json(['ok' => true]);
        }

        $token = $request->bearerToken();
        if (! $token) {
            return response()->json(['ok' => true]);
        }

        try {
            $session = $this->appwrite->currentSessionForJwt($token);
        } catch (AppwriteException) {
            // Invalid, expired, or already-revoked sessions are already logged out.
            return response()->json(['ok' => true]);
        } catch (Throwable) {
            logger()->error('Unable to load the current Appwrite session.');
            abort(503, 'Authentication service is temporarily unavailable.');
        }

        $authUserId = (string) ($session['userId'] ?? '');
        $sessionId = (string) ($session['$id'] ?? $session['id'] ?? '');
        if ($authUserId === '' || $sessionId === '') {
            return response()->json(['ok' => true]);
        }

        try {
            $this->appwrite->revokeUserSession($authUserId, $sessionId);
            $this->appwrite->revokeSessionRecord($sessionId);
            $this->audit->record('logout', $authUserId, $authUserId, $sessionId, $request);
            $this->audit->record('session_revoked', $authUserId, $authUserId, $sessionId, $request);
        } catch (Throwable) {
            logger()->error('Unable to revoke the Appwrite session.');
            abort(503, 'Authentication service is temporarily unavailable.');
        }

        return response()->json(['ok' => true]);
    }

    private function loginWithAppwrite(Request $request, string $opsId, string $password, ?string $mode): JsonResponse
    {
        try {
            $session = $this->appwrite->createEmailPasswordSession($opsId.'@backroom.soc5.internal', $password);
        } catch (RuntimeException) {
            $this->audit->record('login_failed', null, null, null, $request, ['reason' => 'auth_service_unavailable']);
            logger()->error('Unable to create the Appwrite Backroom session.');

            abort(503, 'Authentication service is temporarily unavailable.');
        }

        if (! $session) {
            $this->audit->record('login_failed', null, null, null, $request, ['reason' => 'invalid_credentials']);
            abort(401, 'Invalid Ops ID or password.');
        }
        $authUserId = (string) ($session['userId'] ?? '');
        if ($authUserId === '') {
            $this->audit->record('login_failed', null, null, null, $request, ['reason' => 'invalid_auth_response']);
            abort(401, 'Invalid Ops ID or password.');
        }
        $sessionId = (string) ($session['$id'] ?? $session['id'] ?? '');
        $expiresAt = $session['expire'] ?? $session['expiresAt'] ?? null;
        abort_unless($sessionId !== '' && is_string($expiresAt) && $expiresAt !== '', 503, 'Authentication service is temporarily unavailable.');

        try {
            $profile = $this->profiles->forAuthenticatedUser($authUserId);
        } catch (RuntimeException) {
            logger()->error('Unable to load the Appwrite Backroom profile.');
            abort(503, 'Account database is temporarily unavailable.');
        }

        $activeOpsProfile = $profile
            && ($profile->is_active ?? false)
            && strtolower((string) ($profile->role ?? '')) === 'ops_pic'
            && strtolower((string) ($profile->ops_id ?? '')) === $opsId;
        if (! $activeOpsProfile) {
            $this->audit->record('login_failed', $authUserId, null, $authUserId, $request, ['reason' => 'inactive_or_unprovisioned']);
            $this->audit->record('session_rejected', $authUserId, null, $sessionId, $request, ['reason' => 'inactive_or_unprovisioned']);
            $this->revokeRejectedSession($authUserId, $sessionId, $request, 'inactive_or_unprovisioned');
            abort(403, 'Account is disabled or not provisioned.');
        }

        if ($mode === 'first-login') {
            if (! (bool) ($profile->must_change_password ?? false)) {
                $this->audit->record('login_failed', $authUserId, null, $authUserId, $request, ['reason' => 'first_login_completed']);
                $this->revokeRejectedSession($authUserId, $sessionId, $request, 'first_login_completed');
                abort(409, 'This account has already completed first login.');
            }
        }

        try {
            $accessToken = $this->appwrite->createJwtForSession((string) ($session['secret'] ?? ''));
        } catch (RuntimeException) {
            logger()->error('Unable to create the Appwrite Backroom JWT.');
            abort(503, 'Authentication service is temporarily unavailable.');
        }

        try {
            $this->appwrite->createSessionRecord([
                'user_id' => $authUserId,
                'appwrite_session_id' => $sessionId,
                'expires_at' => $expiresAt,
                'created_at' => now()->toISOString(),
                'revoked_at' => null,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'metadata' => json_encode(['source' => 'backroom_login'], JSON_THROW_ON_ERROR),
                'auth_provider' => 'appwrite',
            ], $sessionId);
        } catch (Throwable) {
            logger()->error('Unable to persist the Appwrite Backroom session.');

            try {
                $this->appwrite->revokeUserSession($authUserId, $sessionId);
            } catch (Throwable) {
                logger()->warning('Unable to revoke the failed Appwrite Backroom session.');
            }

            abort(503, 'Authentication service is temporarily unavailable.');
        }

        $this->audit->record('login_success', $authUserId, $authUserId, $sessionId, $request);

        return response()->json([
            'access_token' => $accessToken,
            'refresh_token' => null,
        ]);
    }

    private function revokeRejectedSession(string $userId, string $sessionId, Request $request, string $reason): void
    {
        try {
            $this->appwrite->revokeUserSession($userId, $sessionId);
            $this->audit->record('session_revoked', $userId, null, $sessionId, $request, ['reason' => $reason]);
        } catch (Throwable) {
            logger()->warning('Unable to revoke rejected Appwrite session', ['event_type' => 'session_revoked']);
        }
    }
}
