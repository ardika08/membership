<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        return ProductResource::collection(
            Product::with('category')->orderByDesc('updated_at')->get(),
        )->response();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $product = Product::create([
            ...$data,
            'slug' => $this->uniqueSlug($data['title']),
            'rating' => 0,
            'sales' => 0,
        ]);

        return response()->json(['data' => new ProductResource($product)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->update($this->validated($request, $product->id));

        return response()->json(['data' => new ProductResource($product->fresh())]);
    }

    /** Toggle tayang/sembunyikan — dipakai switch aktif di halaman admin. */
    public function toggleActive(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'isActive' => ['required', 'boolean'],
        ]);

        $product = Product::findOrFail($id);
        $product->update(['is_active' => $data['isActive']]);

        return response()->json(['data' => new ProductResource($product->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        Product::findOrFail($id)->delete();

        return response()->json(['message' => 'Produk dihapus.']);
    }

    /**
     * Payload frontend camelCase → kolom snake_case.
     */
    protected function validated(Request $request, ?string $ignoreId = null): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'min:5', 'max:150'],
            'category' => ['required', 'string', 'max:100'],
            'price' => ['required', 'integer', 'min:0'],
            'originalPrice' => ['nullable', 'integer', 'min:0'],
            'isActive' => ['nullable', 'boolean'],
            'releaseAt' => ['nullable', 'date'],
            'shortDescription' => ['required', 'string', 'min:10', 'max:160'],
            'description' => ['required', 'string', 'min:20'],
            'cover' => ['required', 'url'],
            'highlights' => ['required', 'array', 'min:1'],
            'highlights.*' => ['string'],
            'includes' => ['required', 'array', 'min:1'],
            'includes.*.label' => ['required_with:includes', 'string'],
            'includes.*.value' => ['required_with:includes', 'string'],
            'downloadType' => ['nullable', Rule::in(['external', 'upload'])],
            'downloadUrl' => ['nullable', 'string'],
            'fileName' => ['nullable', 'string'],
            'fileSize' => ['nullable', 'integer', 'min:0'],
            'fileType' => ['nullable', 'string', 'max:64'],
        ]);

        return [
            'title' => $data['title'],
            'category_slug' => $data['category'],
            'price' => $data['price'],
            'original_price' => $data['originalPrice'] ?? null,
            'is_active' => $data['isActive'] ?? true,
            'release_at' => $data['releaseAt'] ?? null,
            'short_description' => $data['shortDescription'],
            'description' => $data['description'],
            'cover' => $data['cover'],
            'highlights' => array_values(array_filter($data['highlights'], fn ($h) => trim((string) $h) !== '')),
            'includes' => array_values(array_filter(
                $data['includes'],
                fn ($i) => trim((string) ($i['label'] ?? '')) !== '' && trim((string) ($i['value'] ?? '')) !== '',
            )),
            'download_type' => $data['downloadType'] ?? null,
            'download_url' => $data['downloadUrl'] ?? null,
            'file_name' => $data['fileName'] ?? null,
            'file_size' => (int) ($data['fileSize'] ?? 0),
            'file_type' => $data['fileType'] ?? 'ZIP',
        ];
    }

    protected function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: Str::lower(Str::random(8));
        $slug = $base = substr($base, 0, 60);
        $count = 1;

        while (Product::where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$count);
        }

        return $slug;
    }
}
