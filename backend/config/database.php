<?php

return [
    'default' => env('DB_CONNECTION', 'pgsql'),
    'connections' => ['pgsql' => [
        'driver' => 'pgsql', 'host' => env('DB_HOST'), 'port' => env('DB_PORT', 5432),
        'database' => env('DB_DATABASE', 'postgres'), 'username' => env('DB_USERNAME'),
        'password' => env('DB_PASSWORD'), 'charset' => 'utf8', 'prefix' => '',
        'schema' => 'public', 'sslmode' => env('DB_SSLMODE', 'require'),
    ]],
    'redis' => [
        'client' => env('REDIS_CLIENT', 'predis'),
        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'),
            'prefix' => env('REDIS_PREFIX', ''),
            'persistent' => env('REDIS_PERSISTENT', false),
        ],
        'default' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', 6379),
            'database' => env('REDIS_DB', 0),
            'scheme' => env('REDIS_SCHEME', 'tcp'),
        ],
        'cache' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', 6379),
            'database' => env('REDIS_CACHE_DB', 1),
            'scheme' => env('REDIS_SCHEME', 'tcp'),
        ],
        'queue' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', 6379),
            'database' => env('REDIS_QUEUE_DB', 2),
            'scheme' => env('REDIS_SCHEME', 'tcp'),
        ],
        'session' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', 6379),
            'database' => env('REDIS_SESSION_DB', 3),
            'scheme' => env('REDIS_SCHEME', 'tcp'),
        ],
    ],
];
