<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\OwnedProduct;
use App\Models\Transaction;
use App\Services\MayarService;
use App\Services\PaymentService;
use App\Services\PointService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function __construct(
        protected PointService $points,
        protected MayarService $mayar,
        protected PaymentService $payments,
    ) {
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'uuid'],
            'coupon_code' => ['nullable', 'string'],
            'points_to_redeem' => ['nullable', 'integer', 'min:0'],
        ]);

        $user = $request->user();
        $product = \App\Models\Product::where('is_active', true)
            ->whereKey($data['product_id'])
            ->firstOrFail();

        $alreadyOwned = OwnedProduct::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->where('status', 'active')
            ->exists();
        abort_if($alreadyOwned, 409, 'Kamu sudah memiliki produk ini.');

        $baseAmount = $product->price;

        DB::beginTransaction();

        try {
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'invoice_number' => $this->nextInvoiceNumber(),
                'base_amount' => $baseAmount,
                'amount' => $baseAmount,
                'status' => 'pending',
                'invoice_url' => '',
                'expires_at' => now()->addDay(),
            ]);

            // 1) Kupon
            $couponDiscount = 0;
            if (! empty($data['coupon_code'])) {
                $couponDiscount = $this->applyCoupon($data['coupon_code'], $baseAmount, $transaction);
            }

            // 2) Poin
            $pointsRedeemed = 0;
            $requested = (int) ($data['points_to_redeem'] ?? 0);
            if ($requested > 0) {
                $max = $this->points->maxRedeemable($baseAmount, $user->points);
                $pointsRedeemed = min($requested, $max);

                if ($pointsRedeemed < $this->points->minRedeem) {
                    $pointsRedeemed = 0;
                }
            }

            $pointsDiscount = $this->points->pointsToDiscount($pointsRedeemed);
            $amount = max(0, $baseAmount - $couponDiscount - $pointsDiscount);

            if ($pointsRedeemed > 0) {
                $this->points->debitRedeem(
                    $user,
                    $pointsRedeemed,
                    $transaction->id,
                    "Penukaran poin — {$product->title}",
                );
            }

            $transaction->forceFill([
                'coupon_discount' => $couponDiscount,
                'points_redeemed' => $pointsRedeemed,
                'points_discount' => $pointsDiscount,
                'amount' => $amount,
                'points_earned' => $this->points->amountToPoints($amount),
            ])->save();

            OwnedProduct::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                ],
                ['status' => 'pending'],
            );

            // Total Rp 0 (kupon/poin menutup penuh) → tidak perlu invoice
            // Mayar; langsung konfirmasi agar produk langsung aktif.
            $invoiceUrl = '';

            if ($amount <= 0) {
                $this->payments->markPaid($transaction, 'Gratis');
            } else {
                // Invoice Mayar (sandbox atau produksi)
                $invoiceUrl = $this->mayar->createInvoice($transaction->load('user', 'product'));
                $transaction->forceFill(['invoice_url' => $invoiceUrl])->save();
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        return response()->json([
            'transactionId' => $transaction->id,
            'invoiceNumber' => $transaction->invoice_number,
            'invoiceUrl' => $invoiceUrl,
            'amount' => $transaction->amount,
            'baseAmount' => $transaction->base_amount,
            'couponDiscount' => $transaction->coupon_discount,
            'pointsDiscount' => $transaction->points_discount,
            'pointsRedeemed' => $transaction->points_redeemed,
            'pointsEarned' => $transaction->points_earned,
            'expiresAt' => $transaction->expires_at->toIso8601String(),
        ], 201);
    }

    /**
     * Validasi kupon ulang di sisi server dan kembalikan nominal diskonnya.
     */
    protected function applyCoupon(string $code, int $baseAmount, Transaction $transaction): int
    {
        $coupon = Coupon::where('code', strtoupper(trim($code)))->first();

        if (! $coupon || ! $coupon->is_active || $coupon->expires_at->lessThan(Carbon::now())) {
            abort(422, 'Kode kupon tidak valid atau sudah kedaluwarsa.');
        }

        if ($baseAmount < $coupon->min_purchase) {
            abort(422, 'Minimum belanja kupon ini belum terpenuhi.');
        }

        $discount = $coupon->type === 'percentage'
            ? intdiv($baseAmount * $coupon->value, 100)
            : $coupon->value;

        if ($coupon->max_discount !== null && $coupon->max_discount > 0) {
            $discount = min($discount, $coupon->max_discount);
        }

        $discount = min($discount, $baseAmount);

        $transaction->forceFill(['coupon_code' => $coupon->code])->save();

        return $discount;
    }

    protected function nextInvoiceNumber(): string
    {
        $prefix = 'INV-'.now()->format('ymd').'-';

        $count = Transaction::whereDate('created_at', today())->count();

        return sprintf('%s%04d', $prefix, $count + 1);
    }
}
