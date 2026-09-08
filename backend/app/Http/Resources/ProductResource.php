<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Product */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'category' => $this->category_slug,
            'price' => $this->price,
            'originalPrice' => $this->original_price,
            'isActive' => $this->is_active,
            'releaseAt' => $this->release_at?->toIso8601String(),
            'downloadType' => $this->download_type,
            'downloadUrl' => $this->when(
                $request->user('sanctum')?->isAdmin(),
                fn () => $this->download_url,
            ),
            'fileName' => $this->file_name,
            'shortDescription' => $this->short_description,
            'description' => $this->description,
            'cover' => $this->cover,
            'highlights' => $this->highlights ?? [],
            'includes' => $this->includes ?? [],
            'fileSize' => $this->file_size,
            'fileType' => $this->file_type,
            'version' => $this->version,
            'rating' => (float) $this->rating,
            'sales' => $this->sales,
            'updatedAt' => $this->updated_at->toIso8601String(),
        ];
    }
}
