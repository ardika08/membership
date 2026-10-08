<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;

class PasswordResetController extends Controller
{
    /**
     * Kirim tautan reset kata sandi ke email.
     *
     * Selalu membalas sukses agar keberadaan email tidak bocor
     * (mencegah user enumeration).
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::broker()->sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_THROTTLED) {
            return response()->json([
                'message' => 'Mohon tunggu sebentar sebelum meminta tautan baru.',
            ], 429);
        }

        return response()->json([
            'message' => 'Jika email terdaftar, tautan reset kata sandi telah dikirim.',
        ]);
    }

    /**
     * Terapkan kata sandi baru memakai token dari email.
     */
    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', PasswordRule::min(8), 'confirmed'],
        ]);

        $status = Password::broker()->reset(
            $data,
            function ($user, $password) {
                $user->forceFill(['password' => $password])->save();

                // Cabut semua token aktif — paksa login ulang di semua perangkat.
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => match ($status) {
                    Password::INVALID_TOKEN => 'Tautan reset tidak valid atau sudah kedaluwarsa.',
                    Password::INVALID_USER => 'Email tidak terdaftar.',
                    default => 'Gagal mengubah kata sandi.',
                },
            ], 422);
        }

        return response()->json([
            'message' => 'Kata sandi berhasil diubah. Silakan masuk kembali.',
        ]);
    }
}
