<?php

/**
 * Test checkout total Rp 0 (kupon 100%):
 * amount 0 → transaksi langsung paid TANPA membuat invoice (sandbox/mayar).
 *
 * Jalankan setelah server berjalan + DB fresh seed:
 *   php artisan migrate:fresh --seed --force
 *   php artisan serve --host=127.0.0.1 --port=8000
 *   php scripts/test-free-checkout.php
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

echo "1) Login admin\n";
$admin = req('POST', "$base/login", ['email' => 'admin@example.com', 'password' => 'password123']);
check('status 200', $admin['status'] === 200);
$adminToken = $admin['json']['token'] ?? '';
check('token ada', $adminToken !== '');

echo "2) Buat kupon 100%\n";
$coupon = req('POST', "$base/admin/coupons", [
    'code' => 'FREE100',
    'type' => 'percentage',
    'value' => 100,
    'min_purchase' => 0,
    'expiresAt' => date('c', strtotime('+1 day')),
    'description' => 'Test checkout gratis',
], $adminToken);
check('status 201', $coupon['status'] === 201, $coupon);

echo "3) Login member + pilih produk termurah\n";
$login = req('POST', "$base/login", ['email' => 'rizky@example.com', 'password' => 'password123']);
check('status 200', $login['status'] === 200);
$token = $login['json']['token'] ?? '';
$products = req('GET', "$base/products");
$cheapest = null;
foreach (($products['json']['data'] ?? []) as $p) {
    if ($cheapest === null || ($p['price'] ?? 0) < $cheapest['price']) {
        $cheapest = $p;
    }
}
check('produk ditemukan', $cheapest !== null);
echo '     produk: '.$cheapest['title'].' — Rp '.number_format($cheapest['price'])."\n";

echo "4) Checkout dengan kupon FREE100 → total Rp 0\n";
$invoice = req('POST', "$base/create-invoice", [
    'product_id' => $cheapest['id'],
    'coupon_code' => 'FREE100',
], $token);
check('status 201', $invoice['status'] === 201, $invoice);
check('amount 0', ($invoice['json']['amount'] ?? -1) === 0, $invoice);
check('invoiceUrl kosong (tanpa invoice Mayar)', ($invoice['json']['invoiceUrl'] ?? 'x') === '', $invoice);
$trxId = $invoice['json']['transactionId'] ?? '';

echo "5) Transaksi langsung paid + produk aktif\n";
$status = req('GET', "$base/transactions/{$trxId}/status", null, $token);
check('status paid', ($status['json']['status'] ?? '') === 'paid', $status);
$myProducts = req('GET', "$base/my-products", null, $token);
$owned = null;
foreach (($myProducts['json']['data'] ?? []) as $item) {
    if (($item['product']['id'] ?? null) === $cheapest['id']) {
        $owned = $item;
        break;
    }
}
check('produk aktif', ($owned['status'] ?? '') === 'active', $myProducts);

echo "\nSEMUA TES CHECKOUT GRATIS LULUS ✔\n";
