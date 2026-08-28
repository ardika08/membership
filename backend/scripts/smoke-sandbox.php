<?php

/**
 * Smoke test tambahan: halaman simulasi pembayaran (sandbox)
 * + CORS preflight dari origin frontend.
 * Jalankan bersama scripts/smoke.php pada database yang sama.
 */

$api = 'http://127.0.0.1:8000/api';
$web = 'http://127.0.0.1:8000';
$frontendOrigin = 'http://localhost:5173';

function req(string $method, string $url, ?array $body = null, array $extraHeaders = []): array
{
    $ch = curl_init($url);
    $headers = array_merge(['Content-Type: application/json', 'Accept: application/json'], $extraHeaders);
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

echo "A) CORS preflight dari frontend\n";
$headersFound = [];
$ch = curl_init($api.'/products');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'OPTIONS',
    CURLOPT_HTTPHEADER => [
        'Origin: '.$frontendOrigin,
        'Access-Control-Request-Method: GET',
        'Access-Control-Request-Headers: authorization, content-type',
    ],
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$headersFound) {
        $headersFound[] = trim($line);
        return strlen($line);
    },
]);
curl_exec($ch);
$responseCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);
$allowOrigin = '';
foreach ($headersFound as $h) {
    if (stripos($h, 'access-control-allow-origin:') === 0) {
        $allowOrigin = trim(substr($h, strlen('access-control-allow-origin:')));
    }
}
check('preflight 204/200', in_array($responseCode, [200, 204], true), ['code' => $responseCode]);
check('allow-origin cocok dengan frontend', $allowOrigin === $frontendOrigin || $allowOrigin === '*', ['allowOrigin' => $allowOrigin]);

echo "B) Halaman simulasi pembayaran\n";
$login = req('POST', $api.'/login', ['email' => 'salsa@example.com', 'password' => 'password123']);
check('login salsa 200', $login['status'] === 200, $login);
$token = $login['json']['token'];

$products = req('GET', $api.'/products');
$product = null;
foreach ($products['json']['data'] ?? [] as $p) {
    if ($p['price'] !== 399000) {
        $product = $p;
        break;
    }
}
check('produk lain ditemukan (bukan POS)', $product !== null);

$invoice = req('POST', $api.'/create-invoice', ['product_id' => $product['id']], ['Authorization: Bearer '.$token]);
check('invoice 201', $invoice['status'] === 201, $invoice);
$invoiceUrl = $invoice['json']['invoiceUrl'] ?? '';
check('invoiceUrl mengarah ke pay-sandbox', strpos($invoiceUrl, '/pay-sandbox/') !== false, ['url' => $invoiceUrl]);

$page = req('GET', $web.'/pay-sandbox/'.$invoice['json']['invoiceNumber']);
check('halaman sandbox 200', $page['status'] === 200, ['status' => $page['status']]);
check('halaman menampilkan brand', strpos($page['raw'], 'Grafista Digital') !== false);
check('halaman menampilkan nomor invoice', strpos($page['raw'], $invoice['json']['invoiceNumber']) !== false);

$status = req('GET', $web.'/pay-sandbox/'.$invoice['json']['invoiceNumber'].'/status');
check('status endpoint JSON pending', ($status['json']['status'] ?? '') === 'pending', $status);

echo "C) Konfirmasi otomatis 15 detik\n";
$paid = false;
for ($i = 0; $i < 8; $i++) {
    sleep(4);
    $res = req('GET', $web.'/pay-sandbox/'.$invoice['json']['invoiceNumber'].'/status');
    $s = $res['json']['status'] ?? '???';
    echo "     poll #".($i + 1).": {$s}\n";
    if ($s === 'paid') {
        $paid = true;
        break;
    }
}
check('status paid via endpoint sandbox', $paid);

$pagePaid = req('GET', $web.'/pay-sandbox/'.$invoice['json']['invoiceNumber']);
check('halaman menampilkan status lunas', strpos($pagePaid['raw'], 'Pembayaran berhasil') !== false);

echo "\nSEMUA TES LULUS ✔\n";
