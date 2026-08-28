<?php

use App\Http\Controllers\SandboxPayController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Halaman simulasi pembayaran (driver sandbox)
|--------------------------------------------------------------------------
| Hanya relevan saat MAYAR_DRIVER != "mayar". Controller membatasi
| akses 404 otomatis di mode produksi, jadi aman selalu didaftarkan.
*/

Route::get('/pay-sandbox/{invoiceNumber}', [SandboxPayController::class, 'show']);
Route::get('/pay-sandbox/{invoiceNumber}/status', [SandboxPayController::class, 'status']);
