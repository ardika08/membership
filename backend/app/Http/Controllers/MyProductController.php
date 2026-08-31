<?php

namespace App\Http\Controllers;

use App\Http\Resources\OwnedProductResource;
use App\Models\DownloadHistory;
use App\Models\OwnedProduct;
use App\Services\PointService;
use App\Services\R2Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MyProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $owned = OwnedProduct::with('product')
            ->where('user_id', $request->user()->id)
            ->latest('updated_at')
            ->get();

        return OwnedProductResource::collection($owned)->response();
    }

    public function download(Request $request, string $ownedId, R2Service $r2): JsonResponse
    {
        $owned = OwnedProduct::with('product')
            ->where('user_id', $request->user()->id)
            ->whereKey($ownedId)
            ->first();

        abort_if(! $owned, 404, 'Produk tidak ditemukan.');
        abort_if($owned->status !== 'active', 403, 'Pembayaran belum terkonfirmasi.');

        $product = $owned->product;
        abort_if($product->release_at?->isFuture(), 403, 'Produk belum dirilis.');
        $downloadType = $product->download_type ?? 'upload';

        if ($downloadType === 'external') {
            abort_if(! $product->download_url, 422, 'Tautan unduhan belum dikonfigurasi.');

            $url = $product->download_url;
            $fileName = $product->file_name ?? $product->title;
        } else {
            abort_if(! $product->download_url, 422, 'File produk belum diunggah.');

            if (! $r2->enabled()) {
                abort(503, 'Storage R2 belum dikonfigurasi. Hubungi admin.');
            }

            $fileName = $product->file_name ?? basename($product->download_url);
            $url = $r2->presignGet($product->download_url, $fileName);
        }

        $owned->forceFill([
            'download_count' => $owned->download_count + 1,
            'last_downloaded_at' => now(),
        ])->save();

        DownloadHistory::create([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
            'file_name' => $fileName,
            'file_size' => $product->file_size,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'url' => $url,
            'fileName' => $fileName,
            'downloadType' => $downloadType,
        ]);
    }
}
