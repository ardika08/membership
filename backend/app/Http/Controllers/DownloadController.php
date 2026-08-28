<?php

namespace App\Http\Controllers;

use App\Http\Resources\DownloadHistoryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DownloadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $downloads = $request->user()
            ->downloadHistories()
            ->with('product')
            ->latest()
            ->limit(50)
            ->get();

        return DownloadHistoryResource::collection($downloads)->response();
    }
}
