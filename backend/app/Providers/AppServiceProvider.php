<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Arahkan tautan reset ke halaman frontend (bukan route Laravel),
        // memakai domain member (entri pertama FRONTEND_URL).
        ResetPassword::createUrlUsing(function ($user, string $token) {
            $base = rtrim((string) config('app.frontend_url'), '/');
            $query = http_build_query([
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]);

            return "{$base}/reset-password?{$query}";
        });
    }
}
