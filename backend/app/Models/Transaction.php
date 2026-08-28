<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'product_id',
        'invoice_number',
        'mayar_invoice_id',
        'base_amount',
        'coupon_discount',
        'coupon_code',
        'points_redeemed',
        'points_discount',
        'amount',
        'points_earned',
        'points_credited',
        'status',
        'payment_method',
        'invoice_url',
        'paid_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
            'points_credited' => 'boolean',
            'base_amount' => 'integer',
            'coupon_discount' => 'integer',
            'points_discount' => 'integer',
            'amount' => 'integer',
            'points_redeemed' => 'integer',
            'points_earned' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
