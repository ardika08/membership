<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CouponController extends Controller
{
    public function index(): JsonResponse
    {
        return CouponResource::collection(
            Coupon::orderByDesc('created_at')->get(),
        )->response();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        if (Coupon::where('code', $data['code'])->exists()) {
            return response()->json(['message' => 'Kode kupon sudah digunakan.'], 409);
        }

        $coupon = Coupon::create($data);

        return response()->json(['data' => new CouponResource($coupon)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $data = $this->validated($request, updating: true);

        if (isset($data['code']) && Coupon::where('code', $data['code'])->where('id', '!=', $coupon->id)->exists()) {
            return response()->json(['message' => 'Kode kupon sudah digunakan.'], 409);
        }

        $coupon->update($data);

        return response()->json(['data' => new CouponResource($coupon->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        Coupon::findOrFail($id)->delete();

        return response()->json(['message' => 'Kupon dihapus.']);
    }

    /**
     * Store butuh field lengkap; update menerima parsial
     * (mis. hanya { isActive } dari switch di halaman admin).
     * Hanya kunci yang dikirim klien yang masuk hasil.
     */
    protected function validated(Request $request, bool $updating = false): array
    {
        $sometimes = $updating ? 'sometimes' : 'required';

        $data = $request->validate([
            'code' => [$sometimes, 'string', 'min:3', 'max:32'],
            'type' => [$sometimes, Rule::in(['percentage', 'fixed'])],
            'value' => [$sometimes, 'integer', 'min:1'],
            'minPurchase' => ['nullable', 'integer', 'min:0'],
            'maxDiscount' => ['nullable', 'integer', 'min:0'],
            'expiresAt' => [$sometimes, 'date'],
            'description' => [$sometimes, 'string', 'max:200'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $out = [];
        if (array_key_exists('code', $data)) {
            $out['code'] = strtoupper(trim($data['code']));
        }
        if (array_key_exists('type', $data)) {
            $out['type'] = $data['type'];
        }
        if (array_key_exists('value', $data)) {
            $out['value'] = $data['value'];
        }
        if (array_key_exists('minPurchase', $data)) {
            $out['min_purchase'] = $data['minPurchase'] ?? 0;
        }
        if (array_key_exists('maxDiscount', $data)) {
            $out['max_discount'] = $data['maxDiscount'] ?? null;
        }
        if (array_key_exists('expiresAt', $data)) {
            $out['expires_at'] = $data['expiresAt'];
        }
        if (array_key_exists('description', $data)) {
            $out['description'] = $data['description'];
        }
        if (array_key_exists('isActive', $data)) {
            $out['is_active'] = $data['isActive'];
        }

        return $out;
    }
}
