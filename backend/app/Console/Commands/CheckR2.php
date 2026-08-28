<?php

namespace App\Console\Commands;

use App\Services\R2Service;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * Verifikasi koneksi Cloudflare R2:
 * 1. Kredensial terisi
 * 2. Bucket bisa diakses (ListObjects)
 * 3. Roundtrip presigned PUT → GET → delete, persis alur aplikasi
 *
 * Jalankan setelah mengisi R2_* di .env:
 *   php artisan r2:check
 */
class CheckR2 extends Command
{
    protected $signature = 'r2:check';

    protected $description = 'Verifikasi kredensial Cloudflare R2 (akses bucket + test upload/download presigned)';

    public function handle(R2Service $r2): int
    {
        if (! $r2->enabled()) {
            $this->error('Kredensial R2 belum lengkap. Isi dulu di backend/.env:');
            $this->table(['Variabel', 'Cara mendapatkan'], [
                ['R2_ACCOUNT_ID', 'Dashboard Cloudflare → R2 → Account ID (kanan atas)'],
                ['R2_ACCESS_KEY', 'R2 → Manage R2 API Tokens → Create API Token (Object Read & Write)'],
                ['R2_SECRET_KEY', 'Ditampilkan sekali saat token dibuat'],
                ['R2_BUCKET', 'Nama bucket yang sudah dibuat (mis. grafista-products)'],
            ]);

            return self::FAILURE;
        }

        $this->components->twoColumnDetail('Bucket', (string) config('r2.bucket'));
        $this->components->twoColumnDetail('Endpoint', (string) config('r2.endpoint'));
        $this->newLine();

        // 1) Akses bucket dengan kredensial
        try {
            $r2->assertBucketAccessible();
            $this->components->info('✓ Bucket bisa diakses dengan kredensial ini.');
        } catch (\Throwable $e) {
            $this->components->error('✗ Bucket tidak bisa diakses: '.$this->cleanMessage($e));
            $this->newLine();
            $this->line('Cek: R2_BUCKET benar? Token punya permission <comment>Object Read & Write</comment> dan bucket-nya diizinkan?');

            return self::FAILURE;
        }

        // 2) Roundtrip presigned — alur yang sama dengan aplikasi
        $key = 'checks/r2-check-'.now()->format('YmdHis').'.txt';
        $content = 'Grafista R2 check — '.now()->toIso8601String();
        $fileName = 'r2-check.txt';

        try {
            $putUrl = $r2->presignPut('text/plain', $key);
            $put = Http::withBody($content, 'text/plain')->put($putUrl);
            if (! $put->successful()) {
                throw new \RuntimeException('Presigned PUT gagal (HTTP '.$put->status().'): '.mb_substr((string) $put->body(), 0, 200));
            }
            $this->components->info('✓ Upload presigned PUT berhasil.');

            $getUrl = $r2->presignGet($key, $fileName);
            $get = Http::get($getUrl);
            if (! $get->successful()) {
                throw new \RuntimeException('Presigned GET gagal (HTTP '.$get->status().').');
            }
            if ($get->body() !== $content) {
                throw new \RuntimeException('Konten hasil unduhan berbeda dengan yang diunggah.');
            }
            $this->components->info('✓ Download presigned GET berhasil — konten cocok.');

            $disposition = (string) $get->header('Content-Disposition');
            if (str_contains($disposition, 'attachment')) {
                $this->components->info('✓ Header Content-Disposition: attachment aktif (file diunduh, bukan dibuka).');
            } else {
                $this->components->warn('! Content-Disposition tidak terkirim — file bisa terbuka di browser alih-alih terunduh.');
            }
        } catch (\Throwable $e) {
            $this->components->error('✗ Roundtrip gagal: '.$this->cleanMessage($e));

            return self::FAILURE;
        } finally {
            try {
                $r2->deleteObject($key);
                $this->components->info('✓ File test dibersihkan.');
            } catch (\Throwable) {
                $this->components->warn('! File test tidak terhapus — hapus manual di dashboard: '.$key);
            }
        }

        // 3) Pengingat CORS bucket (wajib untuk upload dari browser)
        $this->newLine();
        $this->warn('LANGKAH TERAKHIR — CORS bucket (wajib agar upload dari browser berhasil):');
        $this->line('Dashboard Cloudflare → R2 → bucket <info>'.config('r2.bucket').'</info> → Settings → CORS policy → tempel JSON ini:');
        $this->newLine();
        $this->line($this->corsJson());
        $this->newLine();
        $this->components->info('R2 siap! Uji upload file produk dari halaman admin (Produk → Upload File).');

        return self::SUCCESS;
    }

    /** Kebijakan CORS bucket — origin frontend diambil dari konfigurasi. */
    protected function corsJson(): string
    {
        $origins = array_values(array_unique(array_filter([
            rtrim((string) config('app.frontend_url'), '/'),
            'http://localhost:5173',
        ])));

        return (string) json_encode(
            [
                [
                    'AllowedOrigins' => $origins,
                    'AllowedMethods' => ['GET', 'PUT'],
                    'AllowedHeaders' => ['content-type'],
                    'MaxAgeSeconds' => 3600,
                ],
            ],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES,
        );
    }

    protected function cleanMessage(\Throwable $e): string
    {
        $message = $e->getMessage();

        return mb_strlen($message) > 300 ? mb_substr($message, 0, 300).'…' : $message;
    }
}
