<?php

namespace App\Console\Commands;

use App\Services\R2Service;
use Illuminate\Console\Command;

/**
 * Terapkan CORS policy ke bucket R2 — wajib agar upload langsung
 * dari browser (presigned PUT) tidak diblokir.
 *
 * Perhatian: butuh token dengan permission Admin Read & Write
 * (token Object-only tidak bisa mengubah konfigurasi bucket).
 *
 *   php artisan r2:cors
 *   php artisan r2:cors --origin=https://app.domainanda.com
 */
class ApplyR2Cors extends Command
{
    protected $signature = 'r2:cors {--origin=* : Origin tambahan yang diizinkan}';

    protected $description = 'Terapkan CORS policy ke bucket R2 (butuh token Admin Read & Write)';

    public function handle(R2Service $r2): int
    {
        if (! $r2->enabled()) {
            $this->error('Kredensial R2 belum lengkap — isi R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY di backend/.env.');

            return self::FAILURE;
        }

        $origins = array_values(array_unique(array_filter([
            rtrim((string) config('app.frontend_url'), '/'),
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            ...array_map('trim', $this->option('origin')),
        ])));

        $policy = [
            [
                'AllowedOrigins' => $origins,
                'AllowedMethods' => ['GET', 'PUT'],
                'AllowedHeaders' => ['content-type'],
                'MaxAgeSeconds' => 3600,
            ],
        ];

        $this->components->twoColumnDetail('Bucket', (string) config('r2.bucket'));
        $this->components->twoColumnDetail('Origins', implode(', ', $origins));
        $this->newLine();
        $this->line('Policy yang akan diterapkan:');
        $this->line((string) json_encode($policy, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        $this->newLine();

        try {
            $r2->putCorsPolicy($policy);
        } catch (\Throwable $e) {
            $this->components->error('✗ Gagal menerapkan CORS: '.$this->cleanMessage($e));
            $this->newLine();
            $this->line('Token kamu kemungkinan hanya <comment>Object Read & Write</comment> (tidak boleh mengubah konfigurasi bucket).');
            $this->line('Ada 2 pilihan:');
            $this->line('  1. Buat token <info>Admin Read & Write</info> di R2 → Manage R2 API Tokens, isi ulang R2_ACCESS_KEY/R2_SECRET_KEY di .env, jalankan lagi perintah ini.');
            $this->line('  2. Atau tempel JSON di atas secara manual: dashboard → R2 → bucket → Settings → CORS policy.');

            return self::FAILURE;
        }

        try {
            $applied = $r2->getCorsPolicy();
            $this->components->info('✓ CORS policy tersimpan. Konfigurasi aktif sekarang:');
            $this->line((string) json_encode($applied, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } catch (\Throwable) {
            $this->components->info('✓ CORS policy diterapkan (tidak bisa membaca ulang untuk verifikasi — token admin-read saja dibutuhkan).');
        }

        $this->newLine();
        $this->components->info('Selesai! Upload dari browser sekarang diizinkan. Uji dengan: php artisan r2:check');

        return self::SUCCESS;
    }

    protected function cleanMessage(\Throwable $e): string
    {
        $message = $e->getMessage();

        return mb_strlen($message) > 300 ? mb_substr($message, 0, 300).'…' : $message;
    }
}
