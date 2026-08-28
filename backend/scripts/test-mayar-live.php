<?php

/**
 * Test LIVE integrasi Mayar produksi (tanpa uang):
 *   1. register member unik + create-invoice → invoice NYATA di Mayar
 *   2. polling status  → pending (unpaid di Mayar)
 *   3. invoice ditutup via API Mayar (simulasi batal)
 *   4. polling status  → backend deteksi "closed" → transaksi expired
 *
 * Prasyarat: MAYAR_DRIVER=mayar + MAYAR_API_KEY terisi, server jalan.
 * Invoice test otomatis ditutup sehingga tidak menumpuk di dashboard Mayar.
 * Member didaftarkan unik per run — Mayar menolak invoice duplikat
 * (nama+email+nominal sama) dalam 1 menit.
 *
 *   php scripts/test-mayar-live.php
 *
 * Catatan: skrip membaca database.sqlite langsung. PENTING: koneksi PDO
 * selalu ditutup sebelum memanggil API backend — cursor statement yang
 * belum selesai menahan SHARED lock SQLite dan mem-block write cache
 * backend di server single-worker (deadlock di Windows).
 */

$base = 'http://127.0.0.1:8000/api';

$apiKey = '';
$driver = '';
foreach (file(__DIR__.'/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (preg_match('/^MAYAR_API_KEY=(.+)$/', $line, $m)) {
        $apiKey = trim($m[1]);
    }
    if (preg_match('/^MAYAR_DRIVER=(.+)$/', $line, $m)) {
        $driver = trim($m[1]);
    }
}

if ($driver !== 'mayar' || $apiKey === '') {
    echo "FAIL — set MAYAR_DRIVER=mayar dan isi MAYAR_API_KEY di backend/.env dulu.\n";
    exit(1);
}

function req(string $method, string $url, ?array $body = null, ?string $token = null, array $extraHeaders = []): array
{
    $ch = curl_init($url);
    $headers = array_merge(['Content-Type: application/json', 'Accept: application/json'], $extraHeaders);
    if ($token) {
        $headers[] = 'Authorization: Bearer '.$token;
    }
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 90,
    ] + ($body !== null ? [CURLOPT_POSTFIELDS => json_encode($body)] : []));
    $t0 = microtime(true);
    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'status' => $status,
        'json' => json_decode((string) $raw, true),
        'raw' => (string) $raw,
        'error' => $error,
        'elapsed' => round(microtime(true) - $t0, 2),
    ];
}

$failures = 0;

function check(string $label, bool $ok, array $context = []): void
{
    global $failures;
    echo ($ok ? '  PASS' : '  FAIL')." — {$label}\n";
    if (! $ok) {
        $failures++;
        if ($context) {
            echo '     >> '.substr(json_encode($context, JSON_UNESCAPED_SLASHES), 0, 800)."\n";
        }
    }
}

/** Baca satu baris dari SQLite lalu TUTUP koneksi (wajib — lihat catatan header). */
function dbRow(string $sql, array $params = []): ?array
{
    $pdo = new PDO('sqlite:'.__DIR__.'/../database/database.sqlite');
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    $stmt->closeCursor();
    $pdo = null;

    return $row;
}

echo "1) Register member unik + login\n";
$email = 'mayar-test-'.time().'@example.com';
$register = req('POST', "$base/register", [
    'name' => 'Test Mayar Live',
    'email' => $email,
    'whatsapp' => '08'.str_pad((string) random_int(1000000000, 9999999999), 11, '0', STR_PAD_LEFT),
    'password' => 'password123',
    'password_confirmation' => 'password123',
]);
check('register 201', $register['status'] === 201, $register);
$login = req('POST', "$base/login", ['email' => $email, 'password' => 'password123']);
check('login 200', $login['status'] === 200, $login);
$token = $login['json']['token'] ?? '';
check('token ada', $token !== '');

echo "2) Pilih produk termurah (belum dimiliki user baru)\n";
$products = req('GET', "$base/products");
$product = null;
foreach (($products['json']['data'] ?? []) as $p) {
    if ($product === null || ($p['price'] ?? 0) < $product['price']) {
        $product = $p;
    }
}
check('produk ditemukan', $product !== null);
echo '     produk: '.$product['title'].' — Rp '.number_format($product['price'])."\n";

echo "3) create-invoice → invoice NYATA di Mayar\n";
$invoice = req('POST', "$base/create-invoice", ['product_id' => $product['id']], $token);
echo "     (create-invoice: {$invoice['elapsed']}s)\n";
check('status 201', $invoice['status'] === 201, $invoice);
$invoiceUrl = (string) ($invoice['json']['invoiceUrl'] ?? '');
$trxId = (string) ($invoice['json']['transactionId'] ?? '');
check('invoiceUrl ada (link Mayar asli)', $invoiceUrl !== '' && str_starts_with($invoiceUrl, 'http'), $invoice);
echo '     link: '.$invoiceUrl."\n";
check('transactionId ada', $trxId !== '');

echo "4) mayar_invoice_id tersimpan di DB\n";
$row = dbRow('SELECT mayar_invoice_id, status FROM transactions WHERE id = :id', [':id' => $trxId]);
check('mayar_invoice_id terisi', ! empty($row['mayar_invoice_id']), $row ?? []);
$mayarInvoiceId = (string) ($row['mayar_invoice_id'] ?? '');

echo "5) Polling status → pending (Mayar: unpaid)\n";
$status = req('GET', "$base/transactions/{$trxId}/status", null, $token);
echo "     (status: {$status['elapsed']}s)\n";
check('status pending', ($status['json']['status'] ?? '') === 'pending', $status);

echo "5b) GET /transactions saat masih ada pending — dulu TypeError 500\n";
$list = req('GET', "$base/transactions", null, $token);
check('daftar transaksi 200 (tanpa error server)', $list['status'] === 200, $list);

echo "6) Tutup invoice via API Mayar (simulasi batal — bersih-bersih)\n";
$close = req('GET', "https://api.mayar.id/hl/v1/invoice/close/{$mayarInvoiceId}", null, null, [
    'Authorization: Bearer '.$apiKey,
]);
check('Mayar menutup invoice', (($close['json']['messages'] ?? '') === 'success'), $close);

echo "7) Tunggu 16 detik (throttle sync 15 detik) lalu polling lagi → expired\n";
sleep(16);
$status2 = req('GET', "$base/transactions/{$trxId}/status", null, $token);
echo "     (status #2: {$status2['elapsed']}s)\n";
check('status expired (backend deteksi closed dari Mayar)', ($status2['json']['status'] ?? '') === 'expired', $status2);

echo "8) Produk tidak aktif di My Products (dibersihkan saat expired)\n";
$myProducts2 = req('GET', "$base/my-products", null, $token);
$stillThere = false;
foreach (($myProducts2['json']['data'] ?? []) as $item) {
    if (($item['product']['id'] ?? ($item['id'] ?? '')) === $product['id']) {
        $stillThere = true;
    }
}
check('produk pending hilang dari My Products', ! $stillThere, $myProducts2);

echo "\n";
if ($failures > 0) {
    echo "{$failures} TES GAGAL ✘ — periksa output di atas.\n";
    exit(1);
}

echo "SEMUA TES LIVE MAYAR LULUS ✔\n";
echo "Alur produksi terverifikasi: register → buat invoice → polling unpaid → Mayar closed → backend expired.\n";
echo "Tinggal uji bayar beneran via browser (beli produk → bayar di halaman Mayar → status jadi paid).\n";
