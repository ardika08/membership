<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PointEntry */
class PointEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'amount' => $this->amount,
            'transactionId' => $this->transaction_id,
            'description' => $this->description,
            'createdAt' => $this->created_at->toIso8601String(),
        ];
    }
}
