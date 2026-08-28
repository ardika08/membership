<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PointEntryResource;
use App\Models\PointEntry;
use App\Models\User;
use App\Services\PointService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PointController extends Controller
{
    public function index(): JsonResponse
    {
        $stats = [
            'outstanding' => (int) User::sum('points'),
            'earned30d' => (int) PointEntry::where('type', 'earned')
                ->where('created_at', '>=', now()->subDays(30))
                ->sum('amount'),
            'redeemed30d' => (int) PointEntry::where('type', 'redeemed')
                ->where('created_at', '>=', now()->subDays(30))
                ->sum('amount'),
            'membersWithPoints' => User::where('points', '>', 0)->count(),
        ];

        $entries = PointEntry::with('user')
            ->latest()
            ->limit(100)
            ->get();

        return response()->json([
            'data' => [
                'stats' => $stats,
                'entries' => $entries->map(fn ($entry) => [
                    'id' => $entry->id,
                    'user' => [
                        'id' => $entry->user->id,
                        'name' => $entry->user->name,
                        'email' => $entry->user->email,
                    ],
                    'type' => $entry->type,
                    'amount' => $entry->amount,
                    'description' => $entry->description,
                    'createdAt' => $entry->created_at->toIso8601String(),
                ]),
            ],
        ]);
    }

    /** Penyesuaian manual poin member: { type: add|subtract, amount, note? }. */
    public function adjust(Request $request, string $userId, PointService $points): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:add,subtract'],
            'amount' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:200'],
        ]);

        $user = User::findOrFail($userId);

        try {
            $points->adjust($user, $data['type'], $data['amount'], $data['note'] ?? null);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Poin disesuaikan.']);
    }
}
