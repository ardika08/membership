<?php

/**
 * Test webhook Mayar dengan payload format asli (docs.mayar.id):
 *   { "event": "payment.received", "data": { "status": true, ..., "extraData": {...} } }
 *
 * Jalankan setelah server berjalan + DB fresh seed:
 *   php artisan migrate:fresh --seed --force
 *   php artisan serve --host=127.0.0.1 --port=8000
 *   php scripts/test-mayar-webhook.php
 *
 * APP_ENV harus "local" (MAYAR_WEBHOOK_SECRET kosong → hanya lolos di local).
 */

$base = 'http://127.0.0.1:8000/api';

function req(string $method, string $url, ?array $body = null, ?string $token = null): array
{
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer '.$token;
    }
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 15,
    ] + ($body !== null ? [CURLOPT_POSTFIELDS => json_encode($body)] : []));

    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['status' => $status, 'json' => json_decode((string) $raw, true), 'raw' => (string) $raw];
}

function check(string $label, bool $ok, array $context = []): void
{
    echo ($ok ? '  PASS' : '  FAIL')." — {$label}\n";
    if (! $ok) {
        if ($context) {
            echo '     >> '.substr(json_encode($context, JSON_UNESCAPED_SLASHES), 0, 600)."\n";
        }
        exit(1);
    }
}

echo "1) Login member\n";
$login = req('POST', "$base/login", ['email' => 'rizky@example.com', 'password' => 'password123']);
check('status 200', $login['status'] === 200);
$token = $login['json']['token'] ?? '';
check('token ada', $token !== '');

echo "2) Buat invoice sandbox\n";
$products = req('GET', "$base/products");
$productId = $products['json']['data'][0]['id'] ?? '';
check('ada produk', $productId !== '');
$invoice = req('POST', "$base/create-invoice", ['product_id' => $productId], $token);
check('status 201', $invoice['status'] === 201, $invoice);
$trxId = $invoice['json']['transactionId'] ?? '';
$invoiceNumber = $invoice['json']['invoiceNumber'] ?? '';
check('transactionId ada', $trxId !== '');

echo "3) Webhook format asli Mayar (event payment.received + data.status true + extraData)\n";
$webhook = req('POST', "$base/webhooks/mayar", [
    'event' => 'payment.received',
    'data' => [
        'id' => 'evt-123',
        'status' => true,
        'amount' => $invoice['json']['amount'] ?? 0,
        'customerEmail' => 'rizky@example.com',
        'customerName' => 'Rizky Demo',
        'customerMobile' => '081234567890',
        'extraData' => [
            'transactionId' => $trxId,
            'invoiceNumber' => $invoiceNumber,
        ],
    ],
]);
check('status 200', $webhook['status'] === 200, $webhook);

echo "4) Transaksi jadi paid + produk aktif\n";
$status = req('GET', "$base/transactions/{$trxId}/status", null, $token);
check('status paid', ($status['json']['status'] ?? '') === 'paid', $status);
$myProducts = req('GET', "$base/my-products", null, $token);
$owned = null;
foreach (($myProducts['json']['data'] ?? []) as $item) {
    if (($item['id'] ?? null) === $productId || ($item['product']['id'] ?? null) === $productId) {
        $owned = $item;
        break;
    }
}
check('produk aktif', ($owned['status'] ?? '') === 'active', $myProducts);

echo "5) Webhook duplicate (idempotent) — tidak error, tetap paid\n";
$webhook2 = req('POST', "$base/webhooks/mayar", [
    'event' => 'payment.received',
    'data' => ['status' => true, 'extraData' => ['transactionId' => $trxId]],
]);
check('status 200', $webhook2['status'] === 200, $webhook2);
$status2 = req('GET', "$base/transactions/{$trxId}/status", null, $token);
check('tetap paid', ($status2['json']['status'] ?? '') === 'paid', $status2);

echo "6) Webhook tanpa identifier cocok → 404 (tidak crash)\n";
$webhook3 = req('POST', "$base/webhooks/mayar", [
    'event' => 'payment.received',
    'data' => ['status' => true, 'extraData' => ['transactionId' => '00000000-0000-0000-0000-000000000000']],
]);
check('status 404', $webhook3['status'] === 404, $webhook3);

echo "7) Webhook di local tanpa secret → diterima apa pun token (by design, hanya utk dev)\n";
$ch = curl_init("$base/webhooks/mayar");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json', 'X-Mayar-Token: dev-token'],
    CURLOPT_POSTFIELDS => json_encode(['event' => 'payment.received', 'data' => ['status' => true, 'extraData' => ['transactionId' => '00000000-0000-0000-0000-000000000000']]]),
    CURLOPT_TIMEOUT => 15,
]);
$raw = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
check('status 404 (auth lolos di local, transaksi tidak ditemukan)', $httpCode === 404, ['code' => $httpCode, 'body' => (string) $raw]);

// Catatan: jalur 401 (token salah saat secret terpasang) diverifikasi manual
// dengan MAYAR_WEBHOOK_SECRET sementara — lihat README.

echo "\nSEMUA TES WEBHOOK LULUS ✔\n";
