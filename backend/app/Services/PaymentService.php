<?php

namespace App\Services;

use App\Models\OwnedProduct;
use App\Models\Transaction;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Logika konfirmasi pembayaran: aktifkan akses produk + kredit poin.
 * Dipakai bersama oleh webhook Mayar maupun simulator sandbox.
 */
class PaymentService
{
    public function __construct(protected PointService $points)
    {
    }

    public function markPaid(Transaction $transaction, ?string $paymentMethod = 'QRIS'): void
    {
        DB::transaction(function () use ($transaction, $paymentMethod) {
            if ($transaction->status === 'paid') {
                return; // idempotent
            }

            $transaction->forceFill([
                'status' => 'paid',
                'paid_at' => now(),
                'payment_method' => $paymentMethod ?? $transaction->payment_method,
            ])->save();

            OwnedProduct::updateOrCreate(
                [
                    'user_id' => $transaction->user_id,
                    'product_id' => $transaction->product_id,
                ],
                [
                    'status' => 'active',
                    'purchased_at' => $transaction->paid_at,
                ],
            );

            if (! $transaction->points_credited) {
                $this->points->creditEarned(
                    $transaction->user,
                    $transaction->id,
                    $transaction->points_earned,
                    "Pembelian {$transaction->product->title}",
                );
                $transaction->forceFill(['points_credited' => true])->save();
            }

            $transaction->product->increment('sales');
        });
    }

    public function markExpired(Transaction $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            if ($transaction->status !== 'pending') {
                return;
            }

            $transaction->forceFill(['status' => 'expired'])->save();

            OwnedProduct::where('user_id', $transaction->user_id)
                ->where('product_id', $transaction->product_id)
                ->where('status', 'pending')
                ->delete();

            if ($transaction->points_redeemed > 0) {
                $this->points->refundRedeemed(
                    $transaction->user,
                    $transaction->id,
                    $transaction->points_redeemed,
                    'Pengembalian poin — invoice kedaluwarsa',
                );
            }
        });
    }

    /**
     * Konfirmasi transaksi pending:
     * - driver "mayar"  → sinkronisasi status ke API Mayar (lihat syncFromMayar)
     * - driver sandbox   → simulasi: invoice dianggap terbayar setelah 15 detik
     */
    public function settlePending(Transaction $transaction): void
    {
        if (config('mayar.driver') === 'mayar') {
            $this->syncFromMayar($transaction);

            return;
        }

        if ($transaction->status === 'pending' && now()->greaterThan($transaction->created_at->addSeconds(15))) {
            $this->markPaid($transaction);
        }

        if ($transaction->status === 'pending' && now()->greaterThan($transaction->expires_at)) {
            $this->markExpired($transaction);
        }
    }

    /**
     * Sinkronisasi status transaksi pending ke Mayar via Get Detail / Invoice
     * Status. Ini mekanisme utama konfirmasi pembayaran karena Mayar hanya
     * mengizinkan satu URL webhook per akun (slot bisa terpakai website lain).
     *
     * Throttle 15 detik per transaksi — rate limit Mayar 50 request/menit
     * per API key dan kuotanya dipakai bersama seluruh website di akun.
     */
    public function syncFromMayar(Transaction $transaction): void
    {
        if (config('mayar.driver') !== 'mayar' || $transaction->status !== 'pending') {
            return;
        }

        // Lewat batas waktu lokal → tidak perlu bertanya ke Mayar.
        if (now()->greaterThan($transaction->expires_at)) {
            $this->markExpired($transaction);

            return;
        }

        if (! $transaction->mayar_invoice_id) {
            return;
        }

        $throttleKey = "mayar:sync:{$transaction->id}";

        if (Cache::has($throttleKey)) {
            return;
        }

        Cache::put($throttleKey, true, 15);

        $status = app(MayarService::class)->getInvoiceStatus((string) $transaction->mayar_invoice_id);

        if ($status === null) {
            return; // gagal akses API — coba lagi setelah throttle habis
        }

        if ($status === 'paid') {
            $this->markPaid($transaction);
        } elseif (in_array($status, ['closed', 'expired', 'canceled', 'cancelled', 'failed'], true)) {
            $this->markExpired($transaction);
        }

        // "unpaid" → masih menunggu pembayaran, tidak ada yang berubah.
    }
}
