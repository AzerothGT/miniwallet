<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per side of a money movement (double-entry style).
     *
     * A top-up creates a single `topup` row. A transfer creates two rows sharing
     * the same `reference`: a `transfer_out` for the sender and a `transfer_in`
     * for the recipient. Listing a user's mutations is therefore always a simple
     * `where user_id = ?`, which makes cross-user data leaks structurally
     * impossible rather than something we have to remember to filter.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('reference')->index();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('counterpart_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['topup', 'transfer_in', 'transfer_out']);
            $table->unsignedBigInteger('amount');
            $table->unsignedBigInteger('balance_after');
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
