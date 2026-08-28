<?php

namespace App\Console\Commands;

use App\Services\MayarService;
use Illuminate\Console\Command;

/**
 * Verifikasi koneksi Mayar API:
 * 1. Konfigurasi driver & API key terisi
 * 2. API key valid (GET /hl/v1/balance — read-only, tanpa membuat data)
 *
 * Jalankan setelah mengisi MAYAR_* di .env:
 *   php artisan mayar:check
 */
class CheckMayar extends Command
{
    protected $signature = 'mayar:check';

    protected $description = 'Verifikasi konfigurasi & koneksi Mayar API (driver, API key, mode konfirmasi pembayaran)';

    public function handle(MayarService $mayar): int
    {
        $this->components->twoColumnDetail('Driver', config('mayar.driver'));
        $this->components->twoColumnDetail('Base URL', (string) config('mayar.base_url'));
        $this->components->twoColumnDetail('API Key', $this->maskKey((string) config('mayar.api_key')));
        $this->components->twoColumnDetail('Webhook secret', config('mayar.webhook_secret') ? 'terisi' : '(kosong)');
        $this->newLine();

        if ($mayar->sandbox) {
            $this->components->warn('Driver masih "sandbox" — invoice disimulasikan lokal, tidak memanggil Mayar.');
            $this->line('Untuk produksi, set <info>MAYAR_DRIVER=mayar</info> lalu isi <info>MAYAR_API_KEY</info> di backend/.env.');
            $this->newLine();
            $this->line('Cara mendapatkan API key: dashboard Mayar → <comment>Pengaturan/Settings → API</comment> → buat Secret API Key.');

            return self::SUCCESS;
        }

        if (! config('mayar.api_key')) {
            $this->components->error('MAYAR_DRIVER=mayar tapi MAYAR_API_KEY kosong. Isi dulu di backend/.env.');

            return self::FAILURE;
        }

        // Validasi API key via endpoint read-only
        try {
            $balance = $mayar->getBalance();
            $this->components->info('✓ API key valid — Mayar merespons dengan benar.');
            $this->newLine();

            $this->table(['Balance', 'Nominal (Rp)'], [
                ['Aktif (bisa dicairkan)', number_format((float) ($balance['balanceActive'] ?? 0), 0, ',', '.')],
                ['Pending', number_format((float) ($balance['balancePending'] ?? 0), 0, ',', '.')],
                ['Total', number_format((float) ($balance['balance'] ?? 0), 0, ',', '.')],
            ]);
        } catch (\Throwable $e) {
            $this->components->error('✗ Koneksi Mayar gagal: '.$this->cleanMessage($e));
            $this->newLine();
            $this->line('Cek: <info>MAYAR_API_KEY</info> benar? Base URL <info>'.config('mayar.base_url').'</info> (produksi) vs https://api.mayar.io (sandbox)?');

            return self::FAILURE;
        }

        $this->newLine();
        $this->components->info('Mode konfirmasi pembayaran: POLLING API.');
        $this->line('Backend menanyakan status invoice langsung ke Mayar saat member membuka/mem-polling transaksi —');
        $this->line('tidak bergantung pada webhook, jadi aman meski slot webhook akun dipakai website lain.');
        $this->newLine();
        $this->line('Opsional — bila suatu saat slot webhook bebas dan ingin notifikasi real-time:');
        $this->line('  arahkan URL webhook Mayar ke <info>'.rtrim(config('app.url'), '/').'/api/webhooks/mayar</info>');
        $this->line('  lalu isi <info>MAYAR_WEBHOOK_SECRET</info> (kirimkan nilai sama di field token) — tanpa itu, webhook hanya lolos di environment local.');

        return self::SUCCESS;
    }

    protected function maskKey(string $key): string
    {
        if ($key === '') {
            return '(kosong)';
        }

        return mb_substr($key, 0, 4).'••••••'.mb_substr($key, -4);
    }

    protected function cleanMessage(\Throwable $e): string
    {
        $message = $e->getMessage();

        return mb_strlen($message) > 300 ? mb_substr($message, 0, 300).'…' : $message;
    }
}
