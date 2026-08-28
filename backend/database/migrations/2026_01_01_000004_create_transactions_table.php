<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained()->restrictOnDelete();
            $table->string('invoice_number', 64)->unique();
            $table->string('mayar_invoice_id', 128)->nullable()->index();
            $table->unsignedBigInteger('base_amount');
            $table->unsignedBigInteger('coupon_discount')->default(0);
            $table->string('coupon_code', 64)->nullable();
            $table->unsignedInteger('points_redeemed')->default(0);
            $table->unsignedBigInteger('points_discount')->default(0);
            $table->unsignedBigInteger('amount');
            $table->unsignedInteger('points_earned')->default(0);
            $table->boolean('points_credited')->default(false);
            $table->string('status', 16)->default('pending')->index(); // pending|paid|expired|failed
            $table->string('payment_method', 64)->nullable();
            $table->string('invoice_url');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
