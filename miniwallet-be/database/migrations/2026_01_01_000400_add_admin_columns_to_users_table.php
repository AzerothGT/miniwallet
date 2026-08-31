<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds the administration columns.
     *
     * `role` defaults to `user`, so an account can only become an administrator
     * through a deliberate change — never by accident of registration.
     *
     * Suspension is a nullable timestamp rather than a boolean: "when was this
     * account suspended" answers strictly more than "is it suspended", and the
     * answer is often the first thing anyone asks.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('user')->after('phone')->index();
            $table->timestamp('suspended_at')->nullable()->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropColumn(['role', 'suspended_at']);
        });
    }
};
