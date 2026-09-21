<?php

return [

    'admin_emails' => array_values(array_filter(array_map('trim', explode(',', env('ADMIN_EMAILS', ''))))),
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
    'google_sheets' => [
        'spreadsheet_id' => env('GOOGLE_SHEETS_SPREADSHEET_ID', '1Po3LyyOAJ8Q-EbX_807RSxrA_grwmsdlsPPP4FFFBig'),
        'sheet_name' => env('GOOGLE_SHEETS_SHEET_NAME', 'Sheet1'),
        'credentials_json' => env('GOOGLE_SHEETS_CREDENTIALS_JSON'),
        'credentials_path' => env('GOOGLE_SHEETS_CREDENTIALS_PATH'),
        'sync_enabled' => (bool) env('GOOGLE_SHEETS_SYNC_ENABLED', false),
        'max_rows' => (int) env('GOOGLE_SHEETS_MAX_ROWS', 50000),
        'connect_timeout' => (float) env('GOOGLE_SHEETS_CONNECT_TIMEOUT', 5),
        'timeout' => (float) env('GOOGLE_SHEETS_TIMEOUT', 30),
    ],
];
