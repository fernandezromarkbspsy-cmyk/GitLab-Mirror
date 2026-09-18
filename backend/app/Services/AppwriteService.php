<?php

namespace App\Services;

use Appwrite\Client;
use Appwrite\Services\Account;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AppwriteService
{
    public function createAuthUser(string $email, string $password, string $name): ?array
    {
        $response = $this->adminAuthRequest('POST', 'users', [
            'userId' => 'unique()',
            'email' => $email,
            'password' => $password,
            'name' => $name,
        ]);

        if ($response->status() === 409) {
            return null;
        }

        return $this->decode($response);
    }

    public function updateAuthUser(string $userId, array $data): void
    {
        if (array_key_exists('name', $data)) {
            $this->adminAuthRequest('PUT', 'users/'.$userId.'/name', ['name' => $data['name']]);
        }

        if (array_key_exists('email', $data)) {
            $this->adminAuthRequest('PUT', 'users/'.$userId.'/email', ['email' => $data['email'], 'emailVerification' => true]);
        }
    }

    public function updateAuthUserPassword(string $userId, string $password): void
    {
        $this->adminAuthRequest('PUT', 'users/'.$userId.'/password', ['password' => $password]);
    }

    public function createRecovery(string $email, string $url): bool
    {
        $response = $this->authRequest('POST', 'account/recovery', ['email' => $email, 'url' => $url]);

        return $response->successful();
    }

    public function completeRecovery(string $userId, string $secret, string $password): bool
    {
        $response = $this->authRequest('PUT', 'account/recovery', [
            'userId' => $userId,
            'secret' => $secret,
            'password' => $password,
        ]);

        return $response->successful();
    }

    public function setAuthUserStatus(string $userId, bool $isActive): void
    {
        $this->adminAuthRequest('PUT', 'users/'.$userId.'/status', ['status' => $isActive]);
    }

    public function revokeAllUserSessions(string $userId): void
    {
        $response = $this->adminAuthRequest('DELETE', 'users/'.$userId.'/sessions');
        if ($response->status() === 404) {
            return;
        }
    }

    public function createEmailPasswordSession(string $email, string $password): ?array
    {
        $response = $this->authRequest('POST', 'account/sessions/email', [
            'email' => $email,
            'password' => $password,
        ]);

        if ($response->status() === 401 || $response->status() === 404) {
            return null;
        }

        return $this->decode($response);
    }

    public function createJwtForSession(string $sessionSecret): string
    {
        $response = $this->authRequest('POST', 'account/jwt', null, [
            'X-Appwrite-Session' => $sessionSecret,
        ]);
        $jwt = $response->json('jwt');

        if (! is_string($jwt) || $jwt === '') {
            throw new RuntimeException('Appwrite Auth returned an invalid JWT.');
        }

        return $jwt;
    }

    public function accountForJwt(string $jwt): Account
    {
        return new Account($this->client()->setJWT($jwt));
    }

    public function currentSessionForJwt(string $jwt): array
    {
        return $this->accountForJwt($jwt)->getSession('current');
    }

    public function revokeUserSession(string $userId, string $sessionId): bool
    {
        $endpoint = rtrim((string) config('services.appwrite.endpoint'), '/');
        $projectId = (string) config('services.appwrite.project_id');
        $apiKey = (string) config('services.appwrite.api_key');
        if ($endpoint === '' || $projectId === '' || $apiKey === '') {
            throw new RuntimeException('Appwrite Auth is not configured.');
        }

        $response = Http::withHeaders([
            'X-Appwrite-Project' => $projectId,
            'X-Appwrite-Key' => $apiKey,
            'Accept' => 'application/json',
        ])->withOptions([
            'verify' => config('services.appwrite.ca_bundle') ?: true,
        ])->timeout((int) config('services.appwrite.timeout', 10))
            ->delete($endpoint.'/users/'.$userId.'/sessions/'.$sessionId);

        if ($response->status() === 404) {
            return false;
        }
        if ($response->failed()) {
            throw new RuntimeException('Appwrite session revocation failed with status '.$response->status().'.');
        }

        return true;
    }

    public function revokeSessionRecord(string $sessionId): bool
    {
        $record = $this->getRow('sessions', $sessionId);
        if ($record === null) {
            return false;
        }

        if (! empty($record['revoked_at'])) {
            return true;
        }

        $this->updateRow('sessions', $sessionId, [
            'revoked_at' => now()->toISOString(),
        ]);

        return true;
    }

    public function clientForApiKey(): Client
    {
        $client = $this->client();
        $apiKey = (string) config('services.appwrite.api_key');

        if ($apiKey === '') {
            throw new RuntimeException('Appwrite API key is not configured.');
        }

        return $client->setKey($apiKey);
    }

    public function profileForUser(string $userId): ?array
    {
        return $this->getRow('profiles', $userId);
    }

    public function profilesByOpsId(string $opsId): array
    {
        $query = 'equal("ops_id",['.json_encode($opsId, JSON_THROW_ON_ERROR).'])';
        $response = $this->request('GET', 'profiles/rows?queries%5B%5D='.rawurlencode($query));
        $data = $this->decode($response);

        return array_values(array_filter($data['rows'] ?? $data['documents'] ?? [], 'is_array'));
    }

    public function profiles(): array
    {
        $data = $this->decode($this->request('GET', 'profiles/rows'));

        return array_values(array_filter($data['rows'] ?? $data['documents'] ?? [], 'is_array'));
    }

    public function createSessionRecord(array $data, ?string $rowId = null): array
    {
        return $this->createRow('sessions', $data, $rowId);
    }

    public function createAuditLog(array $data, ?string $rowId = null): array
    {
        return $this->createRow('audit_logs', $data, $rowId);
    }

    public function createPasswordReset(array $data, ?string $rowId = null): array
    {
        return $this->createRow('password_resets', $data, $rowId);
    }

    public function passwordResetForUser(string $userId): ?array
    {
        $queries = [
            'equal("user_id",['.json_encode($userId, JSON_THROW_ON_ERROR).'])',
            'equal("status",["requested"])',
            'orderDesc("requested_at")',
            'limit(1)',
        ];
        $queryString = implode('&', array_map(fn (string $query): string => 'queries%5B%5D='.rawurlencode($query), $queries));
        $data = $this->decode($this->request('GET', 'password_resets/rows?'.$queryString));
        $rows = $data['rows'] ?? $data['documents'] ?? [];

        return is_array($rows[0] ?? null) ? $rows[0] : null;
    }

    public function getRow(string $tableId, string $rowId): ?array
    {
        $response = $this->request('GET', $tableId.'/'.$rowId);

        if ($response->status() === 404) {
            return null;
        }

        return $this->decode($response);
    }

    public function getTable(string $tableId): ?array
    {
        $response = $this->request('GET', $tableId);

        if ($response->status() === 404) {
            return null;
        }

        return $this->decode($response);
    }

    public function createRow(string $tableId, array $data, ?string $rowId = null): array
    {
        $response = $this->request('POST', $tableId.'/rows', [
            'rowId' => $rowId ?? 'unique()',
            'data' => $data,
        ]);

        return $this->decode($response);
    }

    public function updateRow(string $tableId, string $rowId, array $data): array
    {
        $response = $this->request('PATCH', $tableId.'/'.$rowId, ['data' => $data]);

        return $this->decode($response);
    }

    private function request(string $method, string $tableIdOrPath, ?array $payload = null): Response
    {
        $endpoint = rtrim((string) config('services.appwrite.endpoint'), '/');
        $projectId = (string) config('services.appwrite.project_id');
        $apiKey = (string) config('services.appwrite.api_key');
        $databaseId = (string) config('services.appwrite.database_id');
        $tableId = str_contains($tableIdOrPath, '/')
            ? explode('/', $tableIdOrPath, 2)[0]
            : $tableIdOrPath;
        $configuredTableId = (string) config('services.appwrite.tables.'.$tableId, $tableId);
        $path = str_replace($tableId, $configuredTableId, $tableIdOrPath);

        if ($endpoint === '' || $projectId === '' || $apiKey === '' || $databaseId === '') {
            throw new RuntimeException('Appwrite TablesDB is not configured.');
        }

        $request = Http::withHeaders([
            'X-Appwrite-Project' => $projectId,
            'X-Appwrite-Key' => $apiKey,
            'Accept' => 'application/json',
        ])->withOptions([
            'verify' => config('services.appwrite.ca_bundle') ?: true,
        ])->timeout((int) config('services.appwrite.timeout', 10));

        $url = $endpoint.'/tablesdb/'.$databaseId.'/tables/'.$path;
        $response = match ($method) {
            'GET' => $request->get($url),
            'POST' => $request->post($url, $payload ?? []),
            'PATCH' => $request->patch($url, $payload ?? []),
            default => throw new RuntimeException('Unsupported Appwrite TablesDB method.'),
        };

        if ($response->failed() && $response->status() !== 404) {
            throw new RuntimeException('Appwrite TablesDB request failed with status '.$response->status().'.');
        }

        return $response;
    }

    private function authRequest(string $method, string $path, ?array $payload = null, array $headers = [], bool $admin = false): Response
    {
        $endpoint = rtrim((string) config('services.appwrite.endpoint'), '/');
        $projectId = (string) config('services.appwrite.project_id');

        if ($endpoint === '' || $projectId === '') {
            throw new RuntimeException('Appwrite Auth is not configured.');
        }

        $request = Http::withHeaders(array_merge([
            'X-Appwrite-Project' => $projectId,
            'Accept' => 'application/json',
        ], $headers))->withOptions([
            'verify' => config('services.appwrite.ca_bundle') ?: true,
        ])->timeout((int) config('services.appwrite.timeout', 10));

        $response = match ($method) {
            'POST' => $request->post($endpoint.'/'.ltrim($path, '/'), $payload ?? []),
            'PUT' => $request->put($endpoint.'/'.ltrim($path, '/'), $payload ?? []),
            'DELETE' => $request->delete($endpoint.'/'.ltrim($path, '/'), $payload ?? []),
            default => throw new RuntimeException('Unsupported Appwrite Auth method.'),
        };

        if ($response->failed() && ! in_array($response->status(), $admin ? [401, 404, 409] : [401, 404], true)) {
            throw new RuntimeException('Appwrite Auth request failed with status '.$response->status().'.');
        }

        return $response;
    }

    private function adminAuthRequest(string $method, string $path, ?array $payload = null): Response
    {
        $apiKey = (string) config('services.appwrite.api_key');
        if ($apiKey === '') {
            throw new RuntimeException('Appwrite Auth is not configured.');
        }

        return $this->authRequest($method, $path, $payload, ['X-Appwrite-Key' => $apiKey], true);
    }

    private function decode(Response $response): array
    {
        $data = $response->json();
        if (! is_array($data)) {
            throw new RuntimeException('Appwrite TablesDB returned an invalid response.');
        }

        return $data;
    }

    private function client(): Client
    {
        $endpoint = rtrim((string) config('services.appwrite.endpoint'), '/');
        $projectId = (string) config('services.appwrite.project_id');

        if ($endpoint === '' || $projectId === '') {
            throw new RuntimeException('Appwrite Auth is not configured.');
        }

        return (new Client)
            ->setEndpoint($endpoint)
            ->setProject($projectId);
    }
}
