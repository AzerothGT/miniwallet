<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Append-only trail of what happened on the platform.
     *
     * Two separate user columns, because an action and its subject are not always
     * the same person:
     *
     * - `user_id`     whose account the entry concerns
     * - `actor_id`    who performed it, when that differs (an administrator
     *                 suspending someone else's account)
     *
     * Filtering "everything involving user X" therefore matches either column.
     *
     * `user_id` is nullable so a failed login can be recorded even when the email
     * belongs to no account — precisely the case worth keeping.
     *
     * Only `created_at` exists. A log row is never edited, so an `updated_at`
     * would be a column that could only ever lie; the model refuses updates and
     * deletes outright.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('event', 40)->index();
            $table->string('description');

            /*
             * Event-specific context: amount, recipient, previous role. Kept as
             * JSON rather than as columns because the shape differs per event, and
             * a column that is null for eight of nine events documents nothing.
             */
            $table->json('properties')->nullable();

            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();

            $table->timestamp('created_at')->nullable()->index();

            // The log is read newest-first, filtered by person or by event type.
            $table->index(['user_id', 'created_at']);
            $table->index(['event', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
