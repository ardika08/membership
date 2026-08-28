<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;

/**
 * Halaman simulasi pembayaran (driver sandbox).
 *
 * Menggantikan halaman invoice Mayar saat MAYAR_DRIVER != "mayar":
 * invoice dianggap terbayar otomatis 15 detik setelah dibuat
 * (lihat PaymentService::settlePending). Halaman ini hanya tampilan —
 * status tetap diubah oleh polling / webhook, bukan oleh halaman ini.
 */
class SandboxPayController extends Controller
{
    public function show(string $invoiceNumber)
    {
        $this->ensureSandbox();

        $transaction = Transaction::with('product', 'user')
            ->where('invoice_number', $invoiceNumber)
            ->firstOrFail();

        return view('sandbox-pay', [
            'transaction' => $transaction,
            'frontendUrl' => config('app.frontend_url'),
        ]);
    }

    /**
     * Dipanggil halaman sandbox untuk memeriksa status invoice.
     * Tidak ada endpoint "paksa lunas" — 15 detik tetap berlaku
     * agar simulasi konsisten dengan perilaku driver sandbox.
     */
    public function status(string $invoiceNumber, PaymentService $payments): JsonResponse
    {
        $this->ensureSandbox();

        $transaction = Transaction::where('invoice_number', $invoiceNumber)->firstOrFail();
        $payments->settlePending($transaction);

        return response()->json([
            'status' => $transaction->fresh()->status,
        ]);
    }

    private function ensureSandbox(): void
    {
        if (config('mayar.driver') === 'mayar') {
            abort(404);
        }
    }
}
