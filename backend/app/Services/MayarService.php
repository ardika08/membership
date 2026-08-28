<?php

namespace App\Services;

use App\Models\Transaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Integrasi Mayar API (dokumentasi: https://docs.mayar.id).
 *
 * Mekanisme utama konfirmasi pembayaran: POLLING ke endpoint
 * Get Detail / Invoice Status (lihat PaymentService::syncFromMayar),
 * karena Mayar hanya mengizinkan SATU URL webhook per akun —
 * slot webhook bisa saja terpakai oleh website lain.
 */
class MayarService
{
    public bool $sandbox;

    public function __construct()
    {
        $this->sandbox = config('mayar.driver') !== 'mayar';
    }

    /**
     * Buat invoice di Mayar dan kembalikan URL pembayarannya.
     * Driver sandbox mengembalikan URL simulasi tanpa memanggil API.
     */
    public function createInvoice(Transaction $transaction): string
    {
        if ($this->sandbox) {
            return url("/pay-sandbox/{$transaction->invoice_number}");
        }

        $user = $transaction->user;
        $product = $transaction->product;

        $response = Http::withToken((string) config('mayar.api_key'))
            ->acceptJson()
            ->timeout(15)
            ->post($this->url('/hl/v1/invoice/create'), [
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => preg_replace('/[^0-9]/', '', (string) $user->whatsapp),
                'redirectUrl' => config('app.frontend_url').'/transactions',
                'description' => "Pembelian {$product->title} ({$transaction->invoice_number})",
                'expiredAt' => $transaction->expires_at->copy()->utc()->format('Y-m-d\TH:i:s').'Z',
                'items' => [
                    [
                        'quantity' => 1,
                        'rate' => (int) $transaction->amount,
                        'description' => $product->title,
                    ],
                ],
                'extraData' => [
                    'transactionId' => $transaction->id,
                    'invoiceNumber' => $transaction->invoice_number,
                ],
            ]);

        if ($response->failed()) {
            Log::error('Mayar createInvoice gagal', ['status' => $response->status(), 'body' => $response->body()]);
            abort(502, 'Gagal membuat invoice di Mayar. Coba beberapa saat lagi.');
        }

        $data = (array) $response->json('data');

        if ($mayarId = $data['id'] ?? null) {
            $transaction->forceFill(['mayar_invoice_id' => (string) $mayarId])->save();
        }

        return (string) ($data['link'] ?? '');
    }

    /**
     * Ambil status invoice dari Mayar via Get Detail / Invoice Status.
     * Nilai balik: "unpaid" | "paid" | "closed" (null bila gagal/di-skip).
     */
    public function getInvoiceStatus(string $mayarInvoiceId): ?string
    {
        if ($this->sandbox || $mayarInvoiceId === '') {
            return null;
        }

        try {
            $response = Http::withToken((string) config('mayar.api_key'))
                ->acceptJson()
                ->timeout(10)
                ->get($this->url("/hl/v1/invoice/{$mayarInvoiceId}"));
        } catch (\Throwable $e) {
            Log::warning('Mayar getInvoiceStatus error', ['error' => $e->getMessage()]);

            return null;
        }

        if ($response->failed()) {
            Log::warning('Mayar getInvoiceStatus gagal', [
                'status' => $response->status(),
                'body' => mb_substr((string) $response->body(), 0, 300),
            ]);

            return null;
        }

        $status = strtolower((string) $response->json('data.status'));

        return $status !== '' ? $status : null;
    }

    /**
     * Validasi API key via Get Account Balance (read-only, tidak membuat data).
     * Melempar RuntimeException dengan pesan yang bisa ditampilkan ke user.
     */
    public function getBalance(): array
    {
        $response = Http::withToken((string) config('mayar.api_key'))
            ->acceptJson()
            ->timeout(10)
            ->get($this->url('/hl/v1/balance'));

        if ($response->status() === 401) {
            throw new \RuntimeException('API key ditolak Mayar (401 Unauthorized). Pastikan MAYAR_API_KEY benar dan berasal dari akun produksi.');
        }

        if ($response->failed()) {
            throw new \RuntimeException('Mayar merespons HTTP '.$response->status().': '.mb_substr((string) $response->body(), 0, 200));
        }

        return (array) $response->json('data');
    }

    /**
     * Verifikasi webhook Mayar: cocokkan token dari header dengan secret.
     */
    public function verifyWebhook(?string $token): bool
    {
        $secret = (string) config('mayar.webhook_secret');

        // Tanpa secret terpasang, hanya izinkan di environment lokal.
        if ($secret === '') {
            return app()->environment('local');
        }

        return hash_equals($secret, (string) $token);
    }

    protected function url(string $path): string
    {
        return rtrim((string) config('mayar.base_url'), '/').$path;
    }
}
