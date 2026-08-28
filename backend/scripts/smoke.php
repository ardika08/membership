<?php

/**
 * Smoke test end-to-end alur checkout (driver sandbox).
 * Jalankan setelah server berjalan:
 *   php artisan migrate:fresh --seed --force   (WAJIB — state harus bersih)
 *   php artisan serve --host=127.0.0.1 --port=8000
 *   php scripts/smoke.php
 *   php scripts/smoke-sandbox.php   (halaman simulasi + CORS)
 */

$base = 'http://127.0.0.1:8000/api';

function post(string $url, array $body = [], ?string $token = null): array
{
    return req('POST', $url, $body, $token);
}

function get(string $url, ?string $token = null): array
{
    return req('GET', $url, null, $token);
}

function req(string $method, string $url, ?array $body, ?string $token): array
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
$login = post("$base/login", ['email' => 'rizky@example.com', 'password' => 'password123']);
check('status 200', $login['status'] === 200);
$token = $login['json']['token'] ?? '';
check('token ada', $token !== '');

echo "2) Login admin\n";
$adminLogin = post("$base/login", ['email' => 'admin@example.com', 'password' => 'password123']);
check('role admin', ($adminLogin['json']['user']['role'] ?? '') === 'admin');
$adminToken = $adminLogin['json']['token'];

echo "3) Admin stats terlindungi\n";
$noAuth = get("$base/admin/stats");
check('401 tanpa token', $noAuth['status'] === 401);
$stats = get("$base/admin/stats", $adminToken);
check('admin stats 200 + revenueSeries', $stats['status'] === 200 && isset($stats['json']['data']['revenueSeries']), $stats);

echo "4) Ambil produk uji (POS 399.000)\n";
$products = get("$base/products");
$pos = null;
foreach ($products['json']['data'] ?? [] as $p) {
    if ($p['price'] === 399000) {
        $pos = $p;
        break;
    }
}
check('produk POS ditemukan', $pos !== null);
$productId = $pos['id'];
check('downloadUrl tersembunyi dari publik', ! array_key_exists('downloadUrl', $pos));

echo "5) Validasi kupon WELCOME10 (10%)\n";
$coupon = get("$base/coupons/validate?code=WELCOME10&subtotal=399000", $token);
check('diskon 39.900', ($coupon['json']['discount'] ?? 0) === 39900);

echo "6) Buat invoice: kupon WELCOME10 + tukar 500 poin\n";
$invoice = post("$base/create-invoice", [
    'product_id' => $productId,
    'coupon_code' => 'WELCOME10',
    'points_to_redeem' => 500,
], $token);
check('status 201', $invoice['status'] === 201);
check('baseAmount 399.000', ($invoice['json']['baseAmount'] ?? 0) === 399000);
check('couponDiscount 39.900', ($invoice['json']['couponDiscount'] ?? 0) === 39900);
check('pointsRedeemed 500 → diskon 5.000', ($invoice['json']['pointsRedeemed'] ?? 0) === 500 && ($invoice['json']['pointsDiscount'] ?? 0) === 5000);
$expectedAmount = 399000 - 39900 - 5000;
check("amount {$expectedAmount}", ($invoice['json']['amount'] ?? 0) === $expectedAmount);
$trxId = $invoice['json']['transactionId'];

echo "7) Saldo poin terpotong 1.357 → 857\n";
$points = get("$base/points", $token);
check('balance 857', ($points['json']['data']['balance'] ?? 0) === 857, $points);

echo "8) Polling status (sandbox: paid setelah 15 detik)\n";
$status = 'pending';
for ($i = 0; $i < 8; $i++) {
    sleep(4);
    $res = get("$base/transactions/{$trxId}/status", $token);
    $status = $res['json']['status'] ?? '???';
    echo "     poll #".($i + 1).": {$status}\n";
    if ($status === 'paid') {
        break;
    }
}
check('status paid', $status === 'paid');

echo "9) Akses produk aktif + poin masuk\n";
$myProducts = get("$base/my-products", $token);
$owned = null;
foreach ($myProducts['json']['data'] ?? [] as $o) {
    if ($o['product']['id'] === $productId) {
        $owned = $o;
        break;
    }
}
check('produk berstatus active', ($owned['status'] ?? '') === 'active');

$transactions = get("$base/transactions", $token);
$trx = null;
foreach ($transactions['json']['data'] ?? [] as $t) {
    if ($t['id'] === $trxId) {
        $trx = $t;
        break;
    }
}
check('riwayat transaksi berisi produk', ($trx['product']['title'] ?? '') !== '' && ($trx['invoiceUrl'] ?? '') !== '', $trx);

$downloads = get("$base/downloads", $token);
check('riwayat unduhan 200', $downloads['status'] === 200, $downloads);

$pointsAfter = get("$base/points", $token);
// 857 + floor(354100/1000) = 857 + 354 = 1211
check('poin 857 + 354 = 1.211', ($pointsAfter['json']['data']['balance'] ?? 0) === 1211, $pointsAfter);

echo "10) Admin: toggle kategori dengan payload parsial\n";
$categories = get("$base/categories?all=1", $adminToken);
check('semua kategori tampil utk admin', count($categories['json']['data'] ?? []) >= 5, $categories);
$catId = $categories['json']['data'][0]['id'];

$catOff = req('PUT', "$base/admin/categories/{$catId}", ['isActive' => false], $adminToken);
check('toggle isActive saja → 200', $catOff['status'] === 200, $catOff);
check('kategori jadi nonaktif', ($catOff['json']['data']['isActive'] ?? null) === false, $catOff);

$catOn = req('PUT', "$base/admin/categories/{$catId}", ['isActive' => true], $adminToken);
check('toggle kembali aktif', ($catOn['json']['data']['isActive'] ?? null) === true, $catOn);

echo "11) Admin: kategori baru lalu hapus\n";
$newCat = post("$base/admin/categories", ['name' => 'Kategori Uji', 'description' => 'uji delete', 'color' => '#123456'], $adminToken);
check('kategori baru 201', $newCat['status'] === 201, $newCat);
$delCat = req('DELETE', "$base/admin/categories/{$newCat['json']['data']['id']}", null, $adminToken);
check('kategori kosong bisa dihapus', $delCat['status'] === 200, $delCat);

echo "12) Admin: toggle kupon dengan payload parsial\n";
$coupons = get("$base/admin/coupons", $adminToken);
$couponId = ($coupons['json']['data'][0] ?? [])['id'] ?? '';
check('daftar kupon ada', $couponId !== '', $coupons);

$cpnOff = req('PUT', "$base/admin/coupons/{$couponId}", ['isActive' => false], $adminToken);
check('toggle isActive saja → 200', $cpnOff['status'] === 200, $cpnOff);
check('kupon jadi nonaktif', ($cpnOff['json']['data']['isActive'] ?? null) === false, $cpnOff);

$cpnOn = req('PUT', "$base/admin/coupons/{$couponId}", ['isActive' => true], $adminToken);
check('toggle kembali aktif', ($cpnOn['json']['data']['isActive'] ?? null) === true, $cpnOn);

// Cari kupon lain (bukan GRAFIS20) lalu coba pakai kode yang sudah dipakai → 409
$otherCoupon = null;
foreach ($coupons['json']['data'] as $c) {
    if ($c['code'] !== 'GRAFIS20') {
        $otherCoupon = $c;
        break;
    }
}
if ($otherCoupon) {
    $dupCode = req('PUT', "$base/admin/coupons/{$otherCoupon['id']}", ['code' => 'GRAFIS20'], $adminToken);
    check('kode duplikat saat update ditolak (409)', $dupCode['status'] === 409, $dupCode);
} else {
    echo "  SKIP — tidak ada kupon lain untuk uji duplikat\n";
}

echo "\nSEMUA TES LULUS ✔\n";
