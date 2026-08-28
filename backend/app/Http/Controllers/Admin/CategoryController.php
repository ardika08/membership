<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return CategoryResource::collection(
            Category::orderBy('sort_order')->orderBy('name')->get(),
        )->response();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $category = Category::create([
            ...$data,
            'slug' => $this->uniqueSlug($data['name']),
            'sort_order' => (int) Category::max('sort_order') + 1,
        ]);

        return response()->json(['data' => new CategoryResource($category)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $data = $this->validated($request, updating: true);

        $category->fill($data);
        if (isset($data['name']) && $data['name'] !== $category->getOriginal('name')) {
            $category->slug = $this->uniqueSlug($data['name']);
        }
        $category->save();

        return response()->json(['data' => new CategoryResource($category->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Kategori masih dipakai produk. Pindahkan produk ke kategori lain dulu.',
            ], 409);
        }

        $category->delete();

        return response()->json(['message' => 'Kategori dihapus.']);
    }

    /**
     * Store butuh field lengkap; update menerima parsial
     * (mis. hanya { isActive } dari switch di halaman admin).
     * Hanya kunci yang dikirim klien yang masuk hasil.
     */
    protected function validated(Request $request, bool $updating = false): array
    {
        $sometimes = $updating ? 'sometimes' : 'required';

        $data = $request->validate([
            'name' => [$sometimes, 'string', 'min:2', 'max:60'],
            'description' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:16'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $out = [];
        if (array_key_exists('name', $data)) {
            $out['name'] = $data['name'];
        }
        if (array_key_exists('description', $data)) {
            $out['description'] = $data['description'] ?? '';
        }
        if (array_key_exists('color', $data)) {
            $out['color'] = $data['color'] ?? '#6366f1';
        }
        if (array_key_exists('isActive', $data)) {
            $out['is_active'] = $data['isActive'];
        }

        return $out;
    }

    protected function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'kategori';
        $slug = $base;
        $count = 1;

        while (Category::where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$count);
        }

        return $slug;
    }
}
