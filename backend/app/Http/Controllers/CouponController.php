<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CouponController extends Controller
{
    public function validateCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string'],
            'subtotal' => ['required', 'integer', 'min:0'],
        ]);

        $code = strtoupper(trim($data['code']));
        $subtotal = (int) $data['subtotal'];

        $coupon = Coupon::where('code', $code)->first();

        if (! $coupon) {
            return response()->json(['message' => 'Kode kupon tidak ditemukan.'], 404);
        }

        if (! $coupon->is_active) {
            return response()->json(['message' => 'Kupon ini sudah tidak aktif.'], 422);
        }

        if ($coupon->expires_at->lessThan(Carbon::now())) {
            return response()->json(['message' => 'Kupon sudah kedaluwarsa.'], 422);
        }

        if ($subtotal < $coupon->min_purchase) {
            return response()->json([
                'message' => 'Minimum belanja kupon ini Rp'.number_format($coupon->min_purchase, 0, ',', '.').'.',
            ], 422);
        }

        $discount = $coupon->type === 'percentage'
            ? intdiv($subtotal * $coupon->value, 100)
            : $coupon->value;

        if ($coupon->max_discount !== null && $coupon->max_discount > 0) {
            $discount = min($discount, $coupon->max_discount);
        }

        return response()->json([
            'code' => $coupon->code,
            'description' => $coupon->description,
            'discount' => min($discount, $subtotal),
        ]);
    }
}
