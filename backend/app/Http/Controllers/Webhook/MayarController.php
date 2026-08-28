<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\MayarService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Webhook Mayar (event: payment.received, payment.reminder, dll).
 *
 * Catatan: Mayar hanya mengizinkan SATU URL webhook per akun. Bila slot
 * webhook akun terpakai website lain, konfirmasi pembayaran sepenuhnya
 * ditangani polling API di PaymentService::syncFromMayar — endpoint ini
 * murni opsional (aktif bila webhook diarahkan ke backend ini).
 */
class MayarController extends Controller
{
    public function __invoke(Request $request, MayarService $mayar, PaymentService $payments): JsonResponse
    {
        $token = $request->header('X-Mayar-Token')
            ?? $request->header('Mayar-Token')
            ?? $request->input('token');

        if (! $mayar->verifyWebhook($token)) {
            return response()->json(['message' => 'Token webhook tidak valid.'], 401);
        }

        // Payload asli Mayar: { event: "...", data: { status, amount, ... } }
        $data = (array) $request->input('data', []);
        $extra = (array) ($data['extraData'] ?? []);

        // Identifier transaksi — extraData dari createInvoice + fallback format lama.
        $externalId = $extra['transactionId']
            ?? $extra['invoiceExternalId']
            ?? $data['transactionId']
            ?? $request->input('invoiceExternalId')
            ?? $request->input('external_id')
            ?? $request->input('transactionId')
            ?? $request->input('trx_id');

        $invoiceNumber = $extra['invoiceNumber']
            ?? $data['invoiceNumber']
            ?? $request->input('invoiceNumber')
            ?? $request->input('invoice_number');

        $event = strtolower((string) $request->input('event', ''));
        $rawStatus = $data['status'] ?? $request->input('status');

        $transaction = Transaction::query()
            ->when($externalId, fn ($q) => $q->where('id', $externalId)->orWhere('mayar_invoice_id', (string) $externalId))
            ->when($invoiceNumber, fn ($q) => $q->orWhere('invoice_number', $invoiceNumber))
            ->first();

        if (! $transaction) {
            return response()->json(['message' => 'Transaksi tidak ditemukan.'], 404);
        }

        // data.status Mayar berupa boolean (true = terbayar); event
        // payment.received juga menandai pembayaran sukses. "unpaid"
        // mengandung "paid" — pastikan tidak salah cocok.
        $isPaid = $event === 'payment.received'
            || $rawStatus === true
            || (is_string($rawStatus) && str_contains($rawStatus, 'paid') && ! str_contains($rawStatus, 'unpaid'))
            || (is_string($rawStatus) && (str_contains($rawStatus, 'settlement') || str_contains($rawStatus, 'success')));

        $isFailed = is_string($rawStatus)
            && (str_contains($rawStatus, 'expire') || str_contains($rawStatus, 'fail') || str_contains($rawStatus, 'cancel'));

        if ($isPaid) {
            $payments->markPaid(
                $transaction,
                $data['paymentMethod'] ?? $request->input('paymentMethod') ?? $request->input('payment_channel'),
            );
        } elseif ($isFailed) {
            $payments->markExpired($transaction);
        }

        return response()->json(['message' => 'Webhook diproses.']);
    }
}
