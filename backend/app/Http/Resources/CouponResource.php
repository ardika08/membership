<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Coupon */
class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'value' => $this->value,
            'minPurchase' => $this->min_purchase,
            'maxDiscount' => $this->max_discount,
            'expiresAt' => $this->expires_at->toIso8601String(),
            'description' => $this->description,
            'isActive' => $this->is_active,
        ];
    }
}
