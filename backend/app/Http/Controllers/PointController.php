<?php

namespace App\Http\Controllers;

use App\Http\Resources\PointEntryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PointController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        $totals = DB::table('point_entries')
            ->where('user_id', $user->id)
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'earned' THEN amount ELSE 0 END), 0) AS total_earned")
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'redeemed' THEN amount ELSE 0 END), 0) AS total_redeemed")
            ->first();

        $entries = $user->pointEntries()->latest()->limit(100)->get();

        return response()->json([
            'data' => [
                'balance' => $user->points,
                'totalEarned' => (int) $totals->total_earned,
                'totalRedeemed' => (int) $totals->total_redeemed,
                'entries' => PointEntryResource::collection($entries),
            ],
        ]);
    }
}
