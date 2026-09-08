<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->when(
                $request->boolean('all') && $request->user('sanctum')?->isAdmin(),
                fn ($query) => $query,
                fn ($query) => $query->where('is_active', true),
            )
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories)->response();
    }
}
