<?php

/*
|--------------------------------------------------------------------------
| Mayar Payment Gateway
|--------------------------------------------------------------------------
| driver        : "sandbox" (simulasi, tanpa API key) atau "mayar" (produksi)
| base_url      : https://api.mayar.id (produksi) atau https://api.mayar.io (sandbox)
| api_key       : Secret API key dari dashboard Mayar
| webhook_secret: token verifikasi webhook — OPSIONAL. Konfirmasi pembayaran
|                 utamanya via polling API (PaymentService::syncFromMayar)
|                 karena Mayar hanya mengizinkan satu URL webhook per akun.
|                 Tanpa secret, webhook hanya lolos di environment local.
*/

return [
    'driver' => env('MAYAR_DRIVER', 'sandbox'),
    'base_url' => env('MAYAR_BASE_URL', 'https://api.mayar.id'),
    'api_key' => env('MAYAR_API_KEY'),
    'webhook_secret' => env('MAYAR_WEBHOOK_SECRET'),
];
