<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('category_slug')->index();
            $table->unsignedBigInteger('price')->default(0);
            $table->unsignedBigInteger('original_price')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('download_type', 16)->nullable(); // external | upload
            $table->string('download_url')->nullable();
            $table->string('file_name')->nullable();
            $table->string('short_description', 200);
            $table->text('description');
            $table->string('cover');
            $table->json('highlights');
            $table->json('includes');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('file_type', 64)->default('ZIP');
            $table->string('version', 32)->default('1.0.0');
            $table->decimal('rating', 3, 1)->default(0);
            $table->unsignedInteger('sales')->default(0);
            $table->timestamps();

            $table->foreign('category_slug')
                ->references('slug')
                ->on('categories')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
