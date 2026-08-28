<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\R2Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function presign(Request $request, R2Service $r2): JsonResponse
    {
        if (! $r2->enabled()) {
            return response()->json([
                'message' => 'Cloudflare R2 belum dikonfigurasi. Isi R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY di .env.',
            ], 503);
        }

        $data = $request->validate([
            'fileName' => ['required', 'string', 'max:200'],
            'contentType' => ['required', 'string', 'max:100'],
        ]);

        $safeName = Str::slug(pathinfo($data['fileName'], PATHINFO_FILENAME))
            .'-'.Str::lower(Str::random(8))
            .'.'.pathinfo($data['fileName'], PATHINFO_EXTENSION);

        $objectKey = 'products/'.$safeName;

        return response()->json([
            'uploadUrl' => $r2->presignPut($data['contentType'], $objectKey),
            'objectKey' => $objectKey,
        ]);
    }
}
