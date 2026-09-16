<?php

namespace App\Http\Middleware;

use App\Services\AppwriteService;
use Appwrite\AppwriteException;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use App\Services\ProfileRepository;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class AuthenticateAppwrite
{
    public function __construct(
        private readonly AppwriteService $appwrite,
        private readonly ProfileRepository $profiles,
    )
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        abort_unless($token, 401, 'Authentication required.');

        try {
            $user = $this->appwrite->accountForJwt($token)->get();
        } catch (AppwriteException $exception) {
            Log::warning('Appwrite rejected an authentication token.', [
                'error' => $exception->getMessage(),
            ]);

            abort(401, 'Invalid or expired session.');
        } catch (Throwable $exception) {
            Log::error('Unable to reach Appwrite Auth.', [
                'error' => $exception->getMessage(),
            ]);

            abort(503, 'Authentication service is temporarily unavailable.');
        }

        $authUserId = (string) ($user['$id'] ?? $user['id'] ?? '');
        abort_unless($authUserId !== '', 401, 'Invalid or expired session.');

        try {
            $session = $this->appwrite->currentSessionForJwt($token);
        } catch (AppwriteException $exception) {
            Log::warning('Appwrite rejected the current session.', [
                'error' => $exception->getMessage(),
            ]);

            abort(401, 'Invalid or expired session.');
        } catch (Throwable $exception) {
            Log::error('Unable to load the current Appwrite session.', [
                'error' => $exception->getMessage(),
            ]);

            abort(503, 'Authentication service is temporarily unavailable.');
        }

        $sessionId = (string) ($session['$id'] ?? $session['id'] ?? '');
        abort_unless($sessionId !== '' && (string) ($session['userId'] ?? '') === $authUserId, 401, 'Invalid or expired session.');

        try {
            $sessionRecord = $this->appwrite->getRow('sessions', $sessionId);
        } catch (Throwable $exception) {
            Log::error('Unable to load the Appwrite session record.', [
                'session_id' => $sessionId,
                'error' => $exception->getMessage(),
            ]);

            abort(503, 'Account database is temporarily unavailable.');
        }

        $expiresAt = $sessionRecord['expires_at'] ?? null;
        abort_unless(
            $sessionRecord
                && ($sessionRecord['user_id'] ?? null) === $authUserId
                && ($sessionRecord['auth_provider'] ?? null) === 'appwrite'
                && empty($sessionRecord['revoked_at'])
                && is_string($expiresAt)
                && Carbon::parse($expiresAt)->isFuture(),
            401,
            'Invalid or expired session.'
        );

        try {
            $profile = $this->profiles->forAuthenticatedUser($authUserId);
        } catch (Throwable $exception) {
            Log::error('Unable to load the authenticated Appwrite profile.', [
                'auth_user_id' => $authUserId,
                'sql_state' => $exception->errorInfo[0] ?? null,
                'error' => $exception->getMessage(),
            ]);

            abort(503, 'Account database is temporarily unavailable.');
        }

        abort_unless($profile && ($profile->is_active ?? true), 403, 'Account is disabled or not provisioned.');
        $profile->is_admin = in_array(strtolower((string) $profile->email), array_map('strtolower', config('services.admin_emails', [])), true);
        $profile->original_role = $profile->role;
        $viewRole = $request->header('X-View-Role');
        if ($profile->is_admin && in_array($viewRole, ['ops_pic', 'fte_ops', 'fte_mm', 'doc_officer'], true)) {
            $profile->role = $viewRole;
        }

        $request->attributes->set('actor', $profile);
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
