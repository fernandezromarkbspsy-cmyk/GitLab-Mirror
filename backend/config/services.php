<?php

return [

    'auth' => [
        'provider' => env('AUTH_PROVIDER', 'supabase'),
    ],
    'admin_emails' => array_values(array_filter(array_map('trim', explode(',', env('ADMIN_EMAILS', ''))))),
    'appwrite' => [
        'endpoint' => env('APPWRITE_ENDPOINT'),
        'project_id' => env('APPWRITE_PROJECT_ID'),
        'api_key' => env('APPWRITE_API_KEY'),
        'database_id' => env('APPWRITE_DATABASE_ID', 'soc5_outbound'),
        'ca_bundle' => env('APPWRITE_CA_BUNDLE'),
        'timeout' => (int) env('APPWRITE_TIMEOUT', 10),
        'tables' => [
            'profiles' => env('APPWRITE_PROFILES_TABLE_ID', 'profiles'),
            'sessions' => env('APPWRITE_SESSIONS_TABLE_ID', 'sessions'),
            'audit_logs' => env('APPWRITE_AUDIT_LOGS_TABLE_ID', 'audit_logs'),
            'password_resets' => env('APPWRITE_PASSWORD_RESETS_TABLE_ID', 'password_resets'),
        ],
    ],
    'supabase' => [
        'url' => env('SUPABASE_URL'),
        'anon_key' => env('SUPABASE_PUBLISHABLE_KEY') ?: env('SUPABASE_ANON_KEY'),
        'service_key' => env('SUPABASE_SERVICE_ROLE_KEY'),
        // Do not inherit ambient HTTP(S)_PROXY values accidentally. Set this
        // explicitly only when the deployment requires an outbound proxy.
        'http_proxy' => env('SUPABASE_HTTP_PROXY', ''),
        // Keep TLS verification enabled; provide the CA bundle path when PHP
        // is not connected to the host operating system certificate store.
        'ca_bundle' => env('SUPABASE_CA_BUNDLE'),
        'connect_timeout' => (int) env('SUPABASE_CONNECT_TIMEOUT', 5),
        'timeout' => (int) env('SUPABASE_TIMEOUT', 10),
        // Cache a validated access token for this many seconds to avoid a
        // Supabase round-trip on every request. Set to 0 to disable caching.
        'token_cache_ttl' => (int) env('SUPABASE_TOKEN_CACHE_TTL', 30),
    ],
    'seatalk' => [
        'app_id' => env('SEATALK_APP_ID'),
        'app_secret' => env('SEATALK_APP_SECRET'),
        'redirect_uri' => env('SEATALK_REDIRECT_URI'),
    ],
    'google_sheets' => [
        'spreadsheet_id' => env('GOOGLE_SHEETS_SPREADSHEET_ID', '1Po3LyyOAJ8Q-EbX_807RSxrA_grwmsdlsPPP4FFFBig'),
        'sheet_name' => env('GOOGLE_SHEETS_SHEET_NAME', 'Sheet1'),
        'credentials_json' => env('GOOGLE_SHEETS_CREDENTIALS_JSON'),
        'credentials_path' => env('GOOGLE_SHEETS_CREDENTIALS_PATH'),
        'sync_enabled' => (bool) env('GOOGLE_SHEETS_SYNC_ENABLED', false),
    ],
];
