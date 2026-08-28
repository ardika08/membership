<?php

namespace App\Http\Controllers;

use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request, PaymentService $payments): JsonResponse
    {
        $user = $request->user();

        // Sinkronkan transaksi pending terbaru ke Mayar — menutup skenario
        // member balik dari halaman pembayaran Mayar ke halaman ini
        // (redirectUrl mengarah ke /transactions). Maks 5 transaksi,
        // tiap transaksi di-throttle 15 detik di PaymentService.
        $user->transactions()
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->with('user', 'product')
            ->get()
            ->each(fn (Transaction $transaction) => $payments->settlePending($transaction));

        $transactions = $user->transactions()->with('product')->latest()->get();

        return TransactionResource::collection($transactions)->response();
    }

    /** Dipolling frontend tiap 5 detik (PRD §7.3); di driver mayar juga
     *  men-sync status dari API Mayar. */
    public function status(Request $request, string $id, PaymentService $payments): JsonResponse
    {
        $transaction = $request->user()
            ->transactions()
            ->whereKey($id)
            ->firstOrFail();

        // Driver sandbox: simulasi konfirmasi & kedaluwarsa.
        $payments->settlePending($transaction);

        return response()->json(['status' => $transaction->fresh()->status]);
    }
}
