<?php

/*
|--------------------------------------------------------------------------
| Program Poin — harus identik dengan src/config/index.ts di frontend.
|--------------------------------------------------------------------------
| earn_rate      : Rp belanja yang setara 1 poin (Rp1.000 = 1 poin)
| redeem_value   : nilai 1 poin saat ditukar (1 poin = Rp10)
| min_redeem     : minimal poin untuk ditukar per transaksi
| max_redeem_pct : maksimum diskon poin dari harga produk (persen)
*/

return [
    'earn_rate' => (int) env('POINTS_EARN_RATE', 1000),
    'redeem_value' => (int) env('POINTS_REDEEM_VALUE', 10),
    'min_redeem' => (int) env('POINTS_MIN_REDEEM', 100),
    'max_redeem_percent' => (int) env('POINTS_MAX_REDEEM_PERCENT', 50),
];
