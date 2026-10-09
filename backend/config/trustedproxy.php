<?php

return [
    // Only private Docker/ingress ranges explicitly configured for this
    // deployment may supply forwarded protocol/host/client-IP headers.
    // Leave empty when the API is directly exposed without a trusted proxy.
    'proxies' => array_values(array_filter(array_map('trim', explode(',', (string) env('TRUSTED_PROXIES', ''))))),
];
