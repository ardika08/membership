<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request, PaymentService $payments): JsonResponse
    {
        // Sinkronkan status transaksi pending (semua user) ke Mayar agar
        // halaman admin realtime: invoice yang sudah dibayar/expired di
        // Mayar tidak stale. Maks 10 transaksi; tiap transaksi di-throttle
        // 15 detik di PaymentService — lewat expires_at ditutup lokal
        // tanpa memanggil API Mayar.
        Transaction::with('user', 'product')
            ->where('status', 'pending')
            ->latest()
            ->limit(10)
            ->get()
            ->each(fn (Transaction $transaction) => $payments->settlePending($transaction));

        $transactions = Transaction::with(['product', 'user'])
            ->latest()
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->limit(100)
            ->get();

        return TransactionResource::collection($transactions)->response();
    }
}
