<?php

declare(strict_types=1);

use Appwrite\Client;

require dirname(__DIR__, 2) . '/backend/vendor/autoload.php';

function envValue(string $path, string $name): ?string
{
    if (! is_file($path)) {
        return null;
    }

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        if (preg_match('/^\s*' . preg_quote($name, '/') . '\s*=\s*(.*)$/', $line, $matches)) {
            return trim($matches[1], " \t\"'");
        }
    }

    return null;
}

$envPath = dirname(__DIR__, 2) . '/backend/.env';
$value = static fn (string $name): ?string => getenv($name) ?: envValue($envPath, $name);
$endpoint = $value('APPWRITE_ENDPOINT');
$projectId = $value('APPWRITE_PROJECT_ID');
$apiKey = $value('APPWRITE_API_KEY');
$databaseId = $value('APPWRITE_DATABASE_ID');

if (! $endpoint || ! $projectId || ! $apiKey || ! $databaseId) {
    throw new RuntimeException('Missing Appwrite endpoint, project, API key, or database ID.');
}

$client = (new Client())
    ->setEndpoint($endpoint)
    ->setProject($projectId)
    ->setKey($apiKey);

$call = static function (string $method, string $path, array $params = []) use ($client): array {
    $result = $client->call(
        $method,
        $path,
        ['content-type' => 'application/json'],
        $params
    );

    return is_array($result) ? $result : [];
};

$tableId = static fn (string $name): string => $value('APPWRITE_' . strtoupper($name) . '_TABLE_ID') ?: $name;
$columns = static function (string $table) use ($call, $databaseId): array {
    return $call(Client::METHOD_GET, "/tablesdb/{$databaseId}/tables/{$table}/columns")['columns'] ?? [];
};
$indexes = static function (string $table) use ($call, $databaseId): array {
    return $call(Client::METHOD_GET, "/tablesdb/{$databaseId}/tables/{$table}/indexes")['indexes'] ?? [];
};

$ensureColumn = static function (string $table, string $key, string $type, array $params) use ($columns, $call, $databaseId): void {
    $existing = array_values(array_filter($columns($table), static fn (array $column): bool => ($column['key'] ?? null) === $key));
    if ($existing !== []) {
        if (($existing[0]['type'] ?? null) !== $type) {
            throw new RuntimeException("Column {$table}.{$key} has an unexpected type.");
        }
        return;
    }

    $call(Client::METHOD_POST, "/tablesdb/{$databaseId}/tables/{$table}/columns/{$type}", $params);
    echo "Created column {$table}.{$key}\n";
};

$makeOptional = static function (string $table, string $key, string $type, ?int $size = null) use ($columns, $call, $databaseId): void {
    $existing = array_values(array_filter($columns($table), static fn (array $column): bool => ($column['key'] ?? null) === $key));
    if ($existing === [] || ($existing[0]['type'] ?? null) !== $type) {
        throw new RuntimeException("Expected column {$table}.{$key} was not found with type {$type}.");
    }
    if (! ($existing[0]['required'] ?? false)) {
        return;
    }

    $params = ['required' => false, 'default' => null];
    if ($size !== null) {
        $params['size'] = $size;
    }
    $call(Client::METHOD_PATCH, "/tablesdb/{$databaseId}/tables/{$table}/columns/{$type}/{$key}", $params);
    echo "Made column optional {$table}.{$key}\n";
};

$ensureIndex = static function (string $table, string $key, string $type, array $attributes, array $orders) use ($indexes, $call, $databaseId): void {
    foreach ($indexes($table) as $index) {
        if (($index['key'] ?? null) === $key) {
            return;
        }
    }

    $call(Client::METHOD_POST, "/tablesdb/{$databaseId}/tables/{$table}/indexes", [
        'key' => $key,
        'type' => $type,
        'columns' => $attributes,
        'orders' => $orders,
    ]);
    echo "Created index {$table}.{$key}\n";
};

$profiles = $tableId('PROFILES');
$sessions = $tableId('SESSIONS');
$auditLogs = $tableId('AUDIT_LOGS');
$passwordResets = $tableId('PASSWORD_RESETS');

// Appwrite rejects defaults on required columns; keep the stronger required invariant.
$ensureColumn($profiles, 'is_active', 'boolean', ['key' => 'is_active', 'required' => true]);
$ensureColumn($profiles, 'password_reset_at', 'datetime', ['key' => 'password_reset_at', 'required' => false]);

$makeOptional($sessions, 'token', 'string', 255);
$ensureColumn($sessions, 'appwrite_session_id', 'string', ['key' => 'appwrite_session_id', 'size' => 100, 'required' => true]);
$ensureColumn($sessions, 'created_at', 'datetime', ['key' => 'created_at', 'required' => true]);
$ensureColumn($sessions, 'revoked_at', 'datetime', ['key' => 'revoked_at', 'required' => false]);
$ensureColumn($sessions, 'ip', 'string', ['key' => 'ip', 'size' => 45, 'required' => false]);
$ensureColumn($sessions, 'user_agent', 'string', ['key' => 'user_agent', 'size' => 1000, 'required' => false]);
$ensureColumn($sessions, 'metadata', 'string', ['key' => 'metadata', 'size' => 5000, 'required' => false]);
$ensureColumn($sessions, 'auth_provider', 'string', ['key' => 'auth_provider', 'size' => 20, 'required' => true]);
$ensureIndex($sessions, 'sessions_user_id_idx', 'key', ['user_id'], ['ASC']);
$ensureIndex($sessions, 'sessions_appwrite_session_id_idx', 'key', ['appwrite_session_id'], ['ASC']);
$ensureIndex($sessions, 'sessions_expires_at_idx', 'key', ['expires_at'], ['ASC']);
$ensureIndex($sessions, 'sessions_revoked_at_idx', 'key', ['revoked_at'], ['ASC']);

$ensureColumn($auditLogs, 'event_type', 'string', ['key' => 'event_type', 'size' => 100, 'required' => true]);
$ensureColumn($auditLogs, 'actor_id', 'string', ['key' => 'actor_id', 'size' => 100, 'required' => false]);
$ensureColumn($auditLogs, 'target_id', 'string', ['key' => 'target_id', 'size' => 100, 'required' => false]);
$ensureColumn($auditLogs, 'auth_provider', 'string', ['key' => 'auth_provider', 'size' => 20, 'required' => true]);
$ensureColumn($auditLogs, 'ip', 'string', ['key' => 'ip', 'size' => 45, 'required' => false]);
$ensureColumn($auditLogs, 'user_agent', 'string', ['key' => 'user_agent', 'size' => 1000, 'required' => false]);
$ensureColumn($auditLogs, 'metadata', 'string', ['key' => 'metadata', 'size' => 5000, 'required' => false]);
$ensureIndex($auditLogs, 'audit_logs_user_id_idx', 'key', ['user_id'], ['ASC']);
$ensureIndex($auditLogs, 'audit_logs_event_type_idx', 'key', ['event_type'], ['ASC']);
$ensureIndex($auditLogs, 'audit_logs_created_at_idx', 'key', ['created_at'], ['DESC']);

$makeOptional($passwordResets, 'token', 'string', 255);
$makeOptional($passwordResets, 'used_at', 'datetime');
$ensureColumn($passwordResets, 'actor_id', 'string', ['key' => 'actor_id', 'size' => 100, 'required' => false]);
$ensureColumn($passwordResets, 'requested_at', 'datetime', ['key' => 'requested_at', 'required' => true]);
$ensureColumn($passwordResets, 'completed_at', 'datetime', ['key' => 'completed_at', 'required' => false]);
$ensureColumn($passwordResets, 'status', 'string', ['key' => 'status', 'size' => 30, 'required' => true]);
$ensureColumn($passwordResets, 'reason', 'string', ['key' => 'reason', 'size' => 255, 'required' => false]);
$ensureColumn($passwordResets, 'metadata', 'string', ['key' => 'metadata', 'size' => 5000, 'required' => false]);
$ensureIndex($passwordResets, 'password_resets_user_id_idx', 'key', ['user_id'], ['ASC']);
$ensureIndex($passwordResets, 'password_resets_status_idx', 'key', ['status'], ['ASC']);
$ensureIndex($passwordResets, 'password_resets_requested_at_idx', 'key', ['requested_at'], ['ASC']);

echo "Phase 8C schema preparation completed without deleting columns, indexes, rows, or permissions.\n";
