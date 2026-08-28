<?php

namespace App\Services;

use App\Models\PointEntry;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PointService
{
    public int $earnRate;

    public int $redeemValue;

    public int $minRedeem;

    public int $maxRedeemPercent;

    public function __construct()
    {
        $this->earnRate = (int) config('points.earn_rate');
        $this->redeemValue = (int) config('points.redeem_value');
        $this->minRedeem = (int) config('points.min_redeem');
        $this->maxRedeemPercent = (int) config('points.max_redeem_percent');
    }

    /** Poin yang didapat dari nominal belanja (pembulatan ke bawah). */
    public function amountToPoints(int $amount): int
    {
        return intdiv(max(0, $amount), $this->earnRate);
    }

    /** Batas poin yang boleh ditukar untuk suatu harga (saldo + cap 50%). */
    public function maxRedeemable(int $price, int $balance): int
    {
        $capDiscount = intdiv($price * $this->maxRedeemPercent, 100);
        $maxPoints = intdiv($capDiscount, $this->redeemValue);

        return max(0, min($balance, $maxPoints));
    }

    public function pointsToDiscount(int $points): int
    {
        return $points * $this->redeemValue;
    }

    /**
     * Kredit poin hasil transaksi (idempotent — dipanggil saat webhook/paid).
     */
    public function creditEarned(User $user, string $transactionId, int $points, string $description): void
    {
        if ($points <= 0) {
            return;
        }

        DB::transaction(function () use ($user, $transactionId, $points, $description) {
            $already = PointEntry::where('transaction_id', $transactionId)
                ->where('type', 'earned')
                ->exists();
            if ($already) {
                return;
            }

            User::whereKey($user->id)->increment('points', $points);
            PointEntry::create([
                'user_id' => $user->id,
                'type' => 'earned',
                'amount' => $points,
                'transaction_id' => $transactionId,
                'description' => $description,
            ]);
        });
    }

    /**
     * Tarik poin saat checkout. Melempar exception bila saldo kurang.
     */
    public function debitRedeem(User $user, int $points, string $transactionId, string $description): void
    {
        DB::transaction(function () use ($user, $points, $transactionId, $description) {
            $affected = User::whereKey($user->id)
                ->where('points', '>=', $points)
                ->decrement('points', $points);

            if ($affected === 0) {
                throw new \InvalidArgumentException('Saldo poin tidak mencukupi.');
            }

            PointEntry::create([
                'user_id' => $user->id,
                'type' => 'redeemed',
                'amount' => $points,
                'transaction_id' => $transactionId,
                'description' => $description,
            ]);
        });
    }

    /** Pengembalian poin saat invoice kedaluwarsa (idempotent). */
    public function refundRedeemed(User $user, string $transactionId, int $points, string $description): void
    {
        if ($points <= 0) {
            return;
        }

        DB::transaction(function () use ($user, $transactionId, $points, $description) {
            $already = PointEntry::where('transaction_id', $transactionId)
                ->where('type', 'adjusted')
                ->exists();
            if ($already) {
                return;
            }

            User::whereKey($user->id)->increment('points', $points);
            PointEntry::create([
                'user_id' => $user->id,
                'type' => 'adjusted',
                'amount' => $points,
                'transaction_id' => $transactionId,
                'description' => $description,
            ]);
        });
    }

    /** Penyesuaian manual oleh admin (add/subtract). */
    public function adjust(User $user, string $type, int $amount, ?string $note): void
    {
        DB::transaction(function () use ($user, $type, $amount, $note) {
            if ($type === 'subtract' && $user->points < $amount) {
                throw new \InvalidArgumentException('Saldo poin member tidak mencukupi.');
            }

            $delta = $type === 'subtract' ? -$amount : $amount;
            User::whereKey($user->id)->increment('points', $delta);

            PointEntry::create([
                'user_id' => $user->id,
                'type' => 'adjusted',
                'amount' => $amount,
                'description' => $note ?: ('Penyesuaian poin oleh admin'),
            ]);
        });
    }
}
