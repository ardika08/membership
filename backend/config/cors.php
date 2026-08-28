<?php

/*
|--------------------------------------------------------------------------
| CORS — origin frontend yang diizinkan mengakses API
|--------------------------------------------------------------------------
| Default mengikuti FRONTEND_URL di .env (dev: Vite di 5173).
| Di environment lokal, varian localhost/127.0.0.1 juga diizinkan
| karena Vite bisa diakses lewat keduanya.
| Saat deploy, isi FRONTEND_URL dengan domain frontend, atau
| kosongkan untuk mengizinkan semua origin ('*').
*/

$origin = env('FRONTEND_URL', 'http://localhost:5173');

$origins = $origin !== '' ? [$origin] : ['*'];

if (env('APP_ENV', 'production') === 'local') {
    $origins = array_values(array_unique(array_merge(
        $origins,
        ['http://localhost:5173', 'http://127.0.0.1:5173'],
    )));
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
