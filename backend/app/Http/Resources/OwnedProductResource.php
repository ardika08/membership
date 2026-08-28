<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\OwnedProduct */
class OwnedProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product' => new ProductResource($this->whenLoaded('product')),
            'status' => $this->status,
            'purchasedAt' => $this->purchased_at?->toIso8601String(),
            'downloadCount' => $this->download_count,
            'lastDownloadedAt' => $this->last_downloaded_at?->toIso8601String(),
        ];
    }
}
