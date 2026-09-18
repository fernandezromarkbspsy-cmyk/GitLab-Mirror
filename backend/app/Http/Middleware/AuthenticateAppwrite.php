<?php

namespace App\Http\Middleware;

use App\Services\AppwriteAuditService;
use App\Services\AppwriteService;
use App\Services\ProfileRepository;
use Appwrite\AppwriteException;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class AuthenticateAppwrite
{
    public function __construct(
        private readonly AppwriteService $appwrite,
        private readonly ProfileRepository $profiles,
        private readonly AppwriteAuditService $audit,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if (! $token) {
            $this->audit->record('unauthorized_access', null, null, null, $request, ['reason' => 'missing_bearer_token']);
            abort(401, 'Authentication required.');
        }

        try {
            $user = $this->appwrite->accountForJwt($token)->get();
        } catch (AppwriteException) {
            $this->audit->record('session_rejected', null, null, null, $request, ['reason' => 'invalid_token']);
            Log::warning('Appwrite rejected an authentication token.');

            abort(401, 'Invalid or expired session.');
        } catch (Throwable) {
            Log::error('Unable to reach Appwrite Auth.');

            abort(503, 'Authentication service is temporarily unavailable.');
        }

        $authUserId = (string) ($user['$id'] ?? $user['id'] ?? '');
        abort_unless($authUserId !== '', 401, 'Invalid or expired session.');

        try {
            $session = $this->appwrite->currentSessionForJwt($token);
        } catch (AppwriteException) {
            $this->audit->record('session_rejected', $authUserId, null, null, $request, ['reason' => 'invalid_session']);
            Log::warning('Appwrite rejected the current session.');

            abort(401, 'Invalid or expired session.');
        } catch (Throwable) {
            Log::error('Unable to load the current Appwrite session.');

            abort(503, 'Authentication service is temporarily unavailable.');
        }

        $sessionId = (string) ($session['$id'] ?? $session['id'] ?? '');
        if ($sessionId === '' || (string) ($session['userId'] ?? '') !== $authUserId) {
            $this->audit->record('session_rejected', $authUserId, null, $sessionId ?: null, $request, ['reason' => 'session_identity_mismatch']);
            abort(401, 'Invalid or expired session.');
        }

        try {
            $sessionRecord = $this->appwrite->getRow('sessions', $sessionId);
        } catch (Throwable) {
            Log::error('Unable to load the Appwrite session record.', [
                'session_id' => $sessionId,
            ]);

            abort(503, 'Account database is temporarily unavailable.');
        }

        $expiresAt = $sessionRecord['expires_at'] ?? null;
        $validSession = $sessionRecord
            && ($sessionRecord['user_id'] ?? null) === $authUserId
            && ($sessionRecord['auth_provider'] ?? null) === 'appwrite'
            && empty($sessionRecord['revoked_at'])
            && is_string($expiresAt)
            && Carbon::parse($expiresAt)->isFuture();
        if (! $validSession) {
            $this->audit->record('session_rejected', $authUserId, null, $sessionId, $request, ['reason' => 'revoked_or_expired']);
            abort(401, 'Invalid or expired session.');
        }

        try {
            $profile = $this->profiles->forAuthenticatedUser($authUserId, 'appwrite');
        } catch (Throwable $exception) {
            Log::error('Unable to load the authenticated Appwrite profile.', [
                'auth_user_id' => $authUserId,
                'sql_state' => $exception->errorInfo[0] ?? null,
            ]);

            abort(503, 'Account database is temporarily unavailable.');
        }

        if (! $profile || ! ($profile->is_active ?? false)) {
            $this->audit->record('session_rejected', $authUserId, null, $authUserId, $request, ['reason' => 'inactive_or_unprovisioned']);
            abort(403, 'Account is disabled or not provisioned.');
        }
        $profile->is_admin = in_array(strtolower((string) $profile->email), array_map('strtolower', config('services.admin_emails', [])), true);
        $profile->original_role = $profile->role;
        $viewRole = $request->header('X-View-Role');
        if ($profile->is_admin && in_array($viewRole, ['ops_pic', 'fte_ops', 'fte_mm', 'doc_officer'], true)) {
            $profile->role = $viewRole;
        }

        $request->attributes->set('actor', $profile);
        $request->attributes->set('auth_provider', 'appwrite');
        $request->attributes->set('appwrite_user_id', $authUserId);
        $request->attributes->set('appwrite_session_id', $sessionId);

        if ($profile->must_change_password) {
            $allowed = [
                'GET:api/auth/me',
                'POST:api/auth/password-changed',
            ];
            abort_unless(in_array($request->method().':'.$request->path(), $allowed, true), 403, 'Password change required.');
        }

        return $next($request);
    }
}
