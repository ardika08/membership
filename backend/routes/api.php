<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MyProductController;
use App\Http\Controllers\PointController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\Webhook\MayarController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — kontrak frontend (PRD §9 + fitur tambahan)
|--------------------------------------------------------------------------
*/

// Publik
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{idOrSlug}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/coupons/validate', [CouponController::class, 'validateCode']);

// Webhook payment gateway (tanpa auth — diverifikasi via token)
Route::post('/webhooks/mayar', MayarController::class);

// Member (login)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/my-products', [MyProductController::class, 'index']);
    Route::post('/my-products/{ownedId}/download', [MyProductController::class, 'download']);
    Route::get('/downloads', [DownloadController::class, 'index']);

    Route::post('/create-invoice', [InvoiceController::class, 'store']);
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/{id}/status', [TransactionController::class, 'status']);

    Route::get('/points', [PointController::class, 'summary']);

    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/change-password', [ProfileController::class, 'changePassword']);
});

// Admin (login + role admin)
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/stats', [Admin\StatsController::class, 'index']);
    Route::get('/transactions', [Admin\TransactionController::class, 'index']);

    Route::get('/products', [Admin\ProductController::class, 'index']);
    Route::post('/products', [Admin\ProductController::class, 'store']);
    Route::put('/products/{id}', [Admin\ProductController::class, 'update']);
    Route::patch('/products/{id}', [Admin\ProductController::class, 'toggleActive']);
    Route::delete('/products/{id}', [Admin\ProductController::class, 'destroy']);

    Route::get('/categories', [Admin\CategoryController::class, 'index']);
    Route::post('/categories', [Admin\CategoryController::class, 'store']);
    Route::put('/categories/{id}', [Admin\CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [Admin\CategoryController::class, 'destroy']);

    Route::get('/coupons', [Admin\CouponController::class, 'index']);
    Route::post('/coupons', [Admin\CouponController::class, 'store']);
    Route::put('/coupons/{id}', [Admin\CouponController::class, 'update']);
    Route::delete('/coupons/{id}', [Admin\CouponController::class, 'destroy']);

    Route::get('/users', [Admin\UserController::class, 'index']);
    Route::put('/users/{id}', [Admin\UserController::class, 'update']);
    Route::delete('/users/{id}', [Admin\UserController::class, 'destroy']);
    Route::post('/users/{id}/points', [Admin\PointController::class, 'adjust']);

    Route::get('/points', [Admin\PointController::class, 'index']);
    Route::post('/uploads/presigned', [Admin\UploadController::class, 'presign']);
});
