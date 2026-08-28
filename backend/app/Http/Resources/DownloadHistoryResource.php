<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\DownloadHistory */
class DownloadHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'title' => $this->product->title,
                'cover' => $this->product->cover,
                'category' => $this->product->category_slug,
            ]),
            'fileName' => $this->file_name,
            'fileSize' => $this->file_size,
            'downloadedAt' => $this->created_at->toIso8601String(),
            'ip' => $this->ip,
        ];
    }
}
