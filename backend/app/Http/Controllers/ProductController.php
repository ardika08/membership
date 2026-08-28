<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->where('is_active', true)
            ->when(
                $request->filled('category'),
                fn ($query) => $query->where('category_slug', $request->string('category')),
            )
            ->orderByDesc('sales')
            ->get();

        return ProductResource::collection($products)->response();
    }

    public function show(string $idOrSlug): JsonResponse
    {
        $product = Product::where('is_active', true)
            ->where(function ($query) use ($idOrSlug) {
                $query->where('id', $idOrSlug)->orWhere('slug', $idOrSlug);
            })
            ->firstOrFail();

        return response()->json([
            'data' => new ProductResource($product),
        ]);
    }
}
