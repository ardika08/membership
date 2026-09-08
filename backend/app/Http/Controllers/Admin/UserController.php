<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->where('role', 'member')
            ->withSum(['transactions as total_spent' => fn ($query) => $query
                ->where('status', 'paid')], 'amount')
            ->withCount([
                'ownedProducts as products_owned' => fn ($query) => $query->where('status', 'active'),
            ])
            ->orderByDesc('created_at')
            ->get();

        return AdminUserResource::collection($users)->response();
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::where('role', 'member')->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
            'whatsapp' => ['required', 'string', 'max:32'],
            'role' => ['required', Rule::in(['member', 'admin'])],
            'status' => ['required', Rule::in(['active', 'suspended'])],
        ]);

        $user->update($data);

        return response()->json(['data' => new AdminUserResource($user->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->isAdmin() && User::where('role', 'admin')->count() <= 1) {
            return response()->json(['message' => 'Tidak bisa menghapus admin terakhir.'], 409);
        }

        $user->delete();

        return response()->json(['message' => 'Member dihapus.']);
    }
}
