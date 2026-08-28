<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\PointEntry;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->info('Seeding data demo Grafista Digital…');

        // ---------- Users ----------
        $admin = User::create([
            'name' => 'Admin Nura',
            'email' => 'admin@example.com',
            'whatsapp' => '081200000001',
            'role' => 'admin',
            'points' => 0,
            'status' => 'active',
            'password' => 'password123',
        ]);

        $rizky = User::create([
            'name' => 'Rizky Pratama',
            'email' => 'rizky@example.com',
            'whatsapp' => '081234567890',
            'role' => 'member',
            'points' => 0,
            'status' => 'active',
            'password' => 'password123',
        ]);

        User::create([
            'name' => 'Salsabila Putri',
            'email' => 'salsa@example.com',
            'whatsapp' => '081298765432',
            'role' => 'member',
            'points' => 420,
            'status' => 'active',
            'password' => 'password123',
        ]);

        // ---------- Kategori ----------
        $categories = [
            ['name' => 'Template Canva', 'slug' => 'canva', 'description' => 'Template desain siap edit di Canva', 'color' => '#7c6cf6', 'sort_order' => 1],
            ['name' => 'Template Elementor', 'slug' => 'elementor', 'description' => 'Template website WordPress + Elementor', 'color' => '#e35d8f', 'sort_order' => 2],
            ['name' => 'Ebook', 'slug' => 'ebook', 'description' => 'Ebook & playbook digital product', 'color' => '#f5a623', 'sort_order' => 3],
            ['name' => 'Prompt AI', 'slug' => 'prompt-ai', 'description' => 'Kumpulan prompt AI siap pakai', 'color' => '#3ecf8e', 'sort_order' => 4],
            ['name' => 'Source Code', 'slug' => 'source-code', 'description' => 'Source code aplikasi & tools', 'color' => '#38bdf8', 'sort_order' => 5],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        // ---------- Produk ----------
        $products = [
            [
                'title' => 'Social Media Kit Pro — 300 Template Canva',
                'slug' => 'canva-social-media-kit-pro',
                'category_slug' => 'canva',
                'price' => 149_000, 'original_price' => 299_000,
                'short_description' => '300 template feed, story, dan carousel siap edit untuk brand kamu.',
                'description' => 'Paket lengkap 300 template Canva untuk kebutuhan konten harian: feed minimalis, carousel edukasi, story promosi, sampai cover highlights. Semua elemen editable penuh — warna, font, dan gambar bisa disesuaikan dengan brand kit kamu. Cocok untuk personal brand, UMKM, sampai agensi.',
                'cover' => 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=900&q=80',
                'highlights' => ['300 template feed, story & carousel', 'Editable penuh di Canva Free/Pro', 'Panduan penggunaan + brand kit', 'Update template gratis selamanya'],
                'includes' => [
                    ['label' => 'Format', 'value' => 'Link Canva (editable)'],
                    ['label' => 'Jumlah template', 'value' => '300 template'],
                    ['label' => 'Lisensi', 'value' => 'Personal & komersial'],
                ],
                'file_size' => 0, 'file_type' => 'Link Canva', 'version' => '3.2.0',
                'rating' => 4.9, 'sales' => 1284,
                'download_type' => 'external',
                'download_url' => 'https://drive.google.com/file/d/1GrafistaDemoKitPro300/view?usp=sharing',
                'file_name' => 'Social Media Kit Pro — 300 Template Canva',
            ],
            [
                'title' => 'Elementor Agency Landing Pack',
                'slug' => 'elementor-agency-landing-pack',
                'category_slug' => 'elementor',
                'price' => 249_000, 'original_price' => 450_000, 'is_active' => false,
                'short_description' => '12 landing page premium untuk agensi, SaaS, dan personal brand.',
                'description' => 'Paket template Elementor dengan 12 landing page yang sudah dioptimasi untuk konversi dan Core Web Vitals. Semua section modular sehingga bisa disusun ulang menjadi ratusan kombinasi halaman. Tidak memerlukan plugin berbayar tambahan selain Elementor Free.',
                'cover' => 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=900&q=80',
                'highlights' => ['12 landing page + 60 section modular', 'Responsive breakpoint sudah dirapikan', 'Optimasi kecepatan (LCP < 2.5s)', 'One-click import template kit'],
                'includes' => [
                    ['label' => 'Format', 'value' => 'JSON Template Kit'],
                    ['label' => 'Kompatibilitas', 'value' => 'Elementor 3.20+'],
                    ['label' => 'Lisensi', 'value' => 'Unlimited project'],
                ],
                'file_size' => 42_000_000, 'file_type' => 'ZIP (JSON)', 'version' => '2.4.1',
                'rating' => 4.8, 'sales' => 862,
                'download_type' => 'upload',
                'download_url' => 'products/elementor-agency-landing-pack-2.4.1.zip',
                'file_name' => 'elementor-agency-landing-pack-2.4.1.zip',
            ],
            [
                'title' => 'Digital Product Playbook 2026',
                'slug' => 'ebook-digital-product-playbook',
                'category_slug' => 'ebook',
                'price' => 89_000, 'original_price' => 149_000,
                'short_description' => 'Ebook 180 halaman tentang riset, bikin, dan luncurkan produk digital.',
                'description' => 'Playbook lengkap membangun bisnis produk digital dari nol: validasi ide 7 hari, framework pricing, template landing page, strategi pre-launch, sampai sistem follow-up pembeli. Ditulis berdasarkan riset 50+ creator produk digital Indonesia.',
                'cover' => 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=900&q=80',
                'highlights' => ['180 halaman (PDF + ePub)', '15 template & checklist siap pakai', 'Studi kasus 8 produk digital lokal', 'Bonus: grup diskusi pembaca'],
                'includes' => [
                    ['label' => 'Format', 'value' => 'PDF + ePub'],
                    ['label' => 'Halaman', 'value' => '180 halaman'],
                    ['label' => 'Bahasa', 'value' => 'Indonesia'],
                ],
                'file_size' => 12_800_000, 'file_type' => 'PDF', 'version' => '1.3.0',
                'rating' => 4.8, 'sales' => 2130,
                'download_type' => 'upload',
                'download_url' => 'products/digital-product-playbook-2026.pdf',
                'file_name' => 'digital-product-playbook-2026.pdf',
            ],
            [
                'title' => 'Prompt AI Mega Vault — 1.200 Prompt',
                'slug' => 'prompt-ai-mega-vault',
                'category_slug' => 'prompt-ai',
                'price' => 119_000, 'original_price' => 199_000,
                'short_description' => '1.200 prompt teruji untuk konten, copywriting, dan bisnis.',
                'description' => 'Koleksi 1.200 prompt AI yang sudah diuji di ChatGPT, Claude, dan Gemini — dikelompokkan per use case: konten sosmed, email marketing, copywriting landing page, riset pasar, sampai otomasi operasional. Setiap prompt disertai variabel input dan contoh output.',
                'cover' => 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=900&q=80',
                'highlights' => ['1.200 prompt di 12 kategori', 'Kompatibel ChatGPT, Claude, Gemini', 'Format Notion database + PDF', 'Update prompt bulanan 1 tahun'],
                'includes' => [
                    ['label' => 'Format', 'value' => 'Notion + PDF'],
                    ['label' => 'Jumlah prompt', 'value' => '1.200 prompt'],
                    ['label' => 'Update', 'value' => 'Bulanan (12 bulan)'],
                ],
                'file_size' => 3_600_000, 'file_type' => 'PDF + Notion', 'version' => '4.0.2',
                'rating' => 4.7, 'sales' => 1741,
                'download_type' => 'upload',
                'download_url' => 'products/prompt-ai-mega-vault-4.0.2.zip',
                'file_name' => 'prompt-ai-mega-vault-4.0.2.zip',
            ],
            [
                'title' => 'Copywriting yang Menjual',
                'slug' => 'copywriting-yang-menjual',
                'category_slug' => 'ebook',
                'price' => 79_000,
                'short_description' => 'Panduan menulis copy yang mengubah pembaca jadi pembeli.',
                'description' => 'Rangkuman praktis formula copywriting untuk halaman produk: headline, storyframing, handling objeksi, dan CTA. Dilengkapi 40 contoh sebelum-sesudah dari landing page produk digital nyata.',
                'cover' => 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&q=80',
                'highlights' => ['9 formula headline terbukti', '40 contoh rewrite nyata', 'Framework AIDA & PAS', 'Checklist review copy 21 poin'],
                'includes' => [
                    ['label' => 'Format', 'value' => 'PDF'],
                    ['label' => 'Halaman', 'value' => '96 halaman'],
                    ['label' => 'Bahasa', 'value' => 'Indonesia'],
                ],
                'file_size' => 6_400_000, 'file_type' => 'PDF', 'version' => '1.1.0',
                'rating' => 4.6, 'sales' => 934,
                'download_type' => 'upload',
                'download_url' => 'products/copywriting-yang-menjual.pdf',
                'file_name' => 'copywriting-yang-menjual.pdf',
            ],
            [
                'title' => 'Source Code — Aplikasi Kasir POS (Laravel + React)',
                'slug' => 'source-code-kasir-pos',
                'category_slug' => 'source-code',
                'price' => 399_000, 'original_price' => 799_000,
                'short_description' => 'Aplikasi kasir full-stack siap deploy untuk UMKM.',
                'description' => 'Source code aplikasi kasir (POS) berbasis Laravel 12 + React 19: manajemen produk, transaksi tunai/qris, laporan harian, dan manajemen user. Termasuk Docker compose, dokumentasi instalasi, dan lisensi untuk 1 produk komersial.',
                'cover' => 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80',
                'highlights' => ['Full-stack: Laravel 12 + React 19', 'Mode offline-ready (PWA)', 'Laporan PDF & Excel', 'Dokumentasi deploy lengkap'],
                'includes' => [
                    ['label' => 'Stack', 'value' => 'Laravel 12 + React 19 + MySQL'],
                    ['label' => 'Lisensi', 'value' => '1 produk komersial'],
                    ['label' => 'Support', 'value' => '3 bulan'],
                ],
                'file_size' => 86_000_000, 'file_type' => 'ZIP (source code)', 'version' => '1.0.0',
                'rating' => 4.9, 'sales' => 312,
                'download_type' => 'upload',
                'download_url' => 'products/kasir-pos-laravel-react-1.0.0.zip',
                'file_name' => 'kasir-pos-laravel-react-1.0.0.zip',
            ],
        ];

        foreach ($products as $product) {
            Product::create([
                'is_active' => true,
                ...$product,
            ]);
        }

        // ---------- Kupon ----------
        Coupon::create([
            'code' => 'GRAFIS20',
            'type' => 'percentage',
            'value' => 20,
            'min_purchase' => 100_000,
            'max_discount' => 50_000,
            'expires_at' => now()->addDays(60),
            'description' => 'Diskon 20%, maksimal Rp50.000',
        ]);

        Coupon::create([
            'code' => 'HEMAT50',
            'type' => 'fixed',
            'value' => 50_000,
            'min_purchase' => 200_000,
            'expires_at' => now()->addDays(30),
            'description' => 'Potongan Rp50.000',
        ]);

        Coupon::create([
            'code' => 'WELCOME10',
            'type' => 'percentage',
            'value' => 10,
            'min_purchase' => 0,
            'expires_at' => now()->addDays(90),
            'description' => 'Diskon 10% tanpa minimum belanja',
        ]);

        // ---------- Riwayat poin Rizky (saldo akhir 1.357) ----------
        $pointHistory = [
            ['type' => 'adjusted', 'amount' => 1000, 'description' => 'Bonus pendaftaran member', 'days_ago' => 96],
            ['type' => 'earned', 'amount' => 149, 'description' => 'Pembelian Social Media Kit Pro — 300 Template Canva', 'days_ago' => 52],
            ['type' => 'earned', 'amount' => 119, 'description' => 'Pembelian Prompt AI Mega Vault — 1.200 Prompt', 'days_ago' => 23],
            ['type' => 'redeemed', 'amount' => 100, 'description' => 'Penukaran poin — Copywriting yang Menjual', 'days_ago' => 12],
            ['type' => 'earned', 'amount' => 89, 'description' => 'Pembelian Digital Product Playbook 2026', 'days_ago' => 8],
        ];

        foreach ($pointHistory as $entry) {
            PointEntry::create([
                'user_id' => $rizky->id,
                'type' => $entry['type'],
                'amount' => $entry['amount'],
                'description' => $entry['description'],
                'created_at' => now()->subDays($entry['days_ago']),
                'updated_at' => now()->subDays($entry['days_ago']),
            ]);
        }

        $rizky->forceFill(['points' => 1357])->save();

        $this->command?->info('Seeding selesai.');
        $this->command?->table(
            ['Akun demo', 'Email', 'Password'],
            [
                ['Admin', 'admin@example.com', 'password123'],
                ['Member', 'rizky@example.com', 'password123'],
            ],
        );
    }
}
