<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasUuids;

    protected $fillable = [
        'slug',
        'title',
        'category_slug',
        'price',
        'original_price',
        'is_active',
        'download_type',
        'download_url',
        'file_name',
        'short_description',
        'description',
        'cover',
        'highlights',
        'includes',
        'file_size',
        'file_type',
        'version',
        'rating',
        'sales',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'highlights' => 'array',
            'includes' => 'array',
            'price' => 'integer',
            'original_price' => 'integer',
            'file_size' => 'integer',
            'rating' => 'float',
            'sales' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_slug', 'slug');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
