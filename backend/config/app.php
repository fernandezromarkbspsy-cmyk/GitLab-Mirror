<?php

return ['name' => env('APP_NAME', 'SOC 5 Outbound'), 'env' => env('APP_ENV', 'production'), 'debug' => (bool) env('APP_DEBUG', false), 'url' => env('APP_URL', 'http://localhost'), 'frontend_url' => env('FRONTEND_URL', 'http://127.0.0.1:5173'), 'timezone' => 'Asia/Manila', 'key' => env('APP_KEY'), 'cipher' => 'AES-256-CBC', 'performance_telemetry' => (bool) env('PERFORMANCE_TELEMETRY', env('APP_ENV', 'production') === 'local')];
