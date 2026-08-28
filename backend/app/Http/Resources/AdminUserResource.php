<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'whatsapp' => $this->whatsapp,
            'role' => $this->role,
            'status' => $this->status,
            'points' => $this->points,
            'totalSpent' => (int) ($this->total_spent ?? 0),
            'productsOwned' => (int) ($this->products_owned ?? 0),
            'joinedAt' => $this->created_at->toIso8601String(),
        ];
    }
}
