<?php
/**
 * Smoke test pra-deploy: cek endpoint publik + auth member + auth admin.
 * Hanya operasi baca (tidak membuat invoice / transaksi).
 * Jalankan: php deploy-smoke.php  (dari folder backend/)
 */

$baseUrl = 'http://localhost:8000/api';
$passed = 0;
$failed = 0;

function check(string $name, int $status, array $expected): void
{
    global $passed, $failed;
    $ok = in_array($status, $expected, true);
    $label = $ok ? 'PASS' : 'FAIL';
    echo sprintf("[%s] %-45s -> HTTP %d%s\n", $label, $name, $status, $ok ? '' : ' (harapan: ' . implode('/', $expected) . ')');
    $ok ? $passed++ : $failed++;
}

function call(string $method, string $url, ?array $body = null, ?string $token = null): int
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => array_values(array_filter([
            'Content-Type: application/json',
            'Accept: application/json',
            $token ? "Authorization: Bearer {$token}" : null,
        ])),
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return $status;
}

function loginAndToken(string $url, string $email, string $password): ?string
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['email' => $email, 'password' => $password]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_TIMEOUT => 15,
    ]);
    $raw = curl_exec($ch);
    curl_close($ch);
    $json = json_decode((string) $raw, true);
    return $json['token'] ?? $json['data']['token'] ?? null;
}

echo "=== Smoke Test Pra-Deploy Grafista Digital ===\n\n";

// Endpoint publik
check('GET  /products          (publik)', call('GET', "{$baseUrl}/products"), [200]);
check('GET  /categories        (publik)', call('GET', "{$baseUrl}/categories"), [200]);

// Login member demo
$memberToken = loginAndToken("{$baseUrl}/login", 'rizky@example.com', 'password123');
echo $memberToken
    ? "[PASS] login member rizky@example.com (token diterima)\n"
    : "[FAIL] login member rizky@example.com (token NULL)\n";
$memberToken ? $passed++ : $failed++;

if ($memberToken) {
    check('GET  /my-products       (member)', call('GET', "{$baseUrl}/my-products", null, $memberToken), [200]);
    check('GET  /transactions      (member)', call('GET', "{$baseUrl}/transactions", null, $memberToken), [200]);
    check('GET  /points            (member)', call('GET', "{$baseUrl}/points", null, $memberToken), [200]);
    check('GET  /downloads         (member)', call('GET', "{$baseUrl}/downloads", null, $memberToken), [200]);
}

// Login admin
$adminToken = loginAndToken("{$baseUrl}/login", 'admin@example.com', 'password123');
echo $adminToken
    ? "[PASS] login admin admin@example.com (token diterima)\n"
    : "[FAIL] login admin admin@example.com (token NULL)\n";
$adminToken ? $passed++ : $failed++;

if ($adminToken) {
    check('GET  /admin/stats       (admin)', call('GET', "{$baseUrl}/admin/stats", null, $adminToken), [200]);
    check('GET  /admin/products    (admin)', call('GET', "{$baseUrl}/admin/products", null, $adminToken), [200]);
    check('GET  /admin/users       (admin)', call('GET', "{$baseUrl}/admin/users", null, $adminToken), [200]);
    check('GET  /admin/transactions(admin)', call('GET', "{$baseUrl}/admin/transactions", null, $adminToken), [200]);
}

echo "\n=== Hasil: {$passed} pass, {$failed} fail ===\n";
exit($failed > 0 ? 1 : 0);
