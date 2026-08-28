<?php

/*
|--------------------------------------------------------------------------
| CORS — origin frontend yang diizinkan mengakses API
|--------------------------------------------------------------------------
| Daftar origin diambil dari FRONTEND_URL di .env (bisa beberapa domain,
| dipisah koma — mis. member.grafistadigital.com dan grafistadigital.com).
| Di environment lokal, varian localhost/127.0.0.1 juga diizinkan
| karena Vite bisa diakses lewat keduanya.
| Kosongkan FRONTEND_URL untuk mengizinkan semua origin ('*').
*/

$origins = config('app.frontend_urls') ?? [];

if ($origins === []) {
    $origins = ['*'];
}

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
