<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Transaction */
class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoiceNumber' => $this->invoice_number,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'title' => $this->product->title,
                'cover' => $this->product->cover,
                'category' => $this->product->category_slug,
            ]),
            'amount' => $this->amount,
            'status' => $this->status,
            'paymentMethod' => $this->payment_method,
            'invoiceUrl' => $this->invoice_url,
            'createdAt' => $this->created_at->toIso8601String(),
            'paidAt' => $this->paid_at?->toIso8601String(),
            'baseAmount' => $this->base_amount,
            'couponCode' => $this->coupon_code,
            'pointsRedeemed' => $this->points_redeemed,
        ];
    }
}
