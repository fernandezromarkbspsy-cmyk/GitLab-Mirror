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
    ],
    'backroom' => [
        'initial_password' => env('BACKROOM_INITIAL_PASSWORD'),
    ],
    'seatalk' => [
        'app_id' => env('SEATALK_APP_ID'),
        'app_secret' => env('SEATALK_APP_SECRET'),
        'redirect_uri' => env('SEATALK_REDIRECT_URI'),
    ],
];
