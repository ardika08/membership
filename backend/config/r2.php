<?php

/*
|--------------------------------------------------------------------------
| Cloudflare R2 (S3-compatible)
|--------------------------------------------------------------------------
| Bucket tetap private. Semua akses lewat presigned URL berumur pendek.
| account_id dilihat di dashboard Cloudflare → R2.
*/

return [
    'account_id' => env('R2_ACCOUNT_ID'),
    'access_key' => env('R2_ACCESS_KEY'),
    'secret_key' => env('R2_SECRET_KEY'),
    'bucket' => env('R2_BUCKET', 'grafista-products'),
    'region' => 'auto',
    'endpoint' => env(
        'R2_ENDPOINT',
        env('R2_ACCOUNT_ID')
            ? 'https://'.env('R2_ACCOUNT_ID').'.r2.cloudflarestorage.com'
            : null,
    ),
    'presign_ttl' => 5 * 60, // detik
];
