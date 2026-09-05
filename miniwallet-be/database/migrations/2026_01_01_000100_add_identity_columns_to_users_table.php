<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds the identity columns the wallet needs: `username` for registration
     * uniqueness checks and `phone` so transfers can target either an email
     * address or a phone number.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('username', 30)->after('name');
            });
        }

        if (! Schema::hasColumn('users', 'phone')) {
            Schema::table('users', function (Blueprint $table) {
                // Nullable keeps this migration safe for an already-populated users table.
                $table->string('phone', 20)->nullable()->after('email');
            });
        }

        $indexes = Schema::getIndexes('users');
        $uniqueColumns = array_map(
            static fn (array $index): array => $index['columns'],
            array_filter($indexes, static fn (array $index): bool => $index['unique']),
        );

        Schema::table('users', function (Blueprint $table) use ($uniqueColumns): void {
            if (! in_array(['username'], $uniqueColumns, true)) {
                $table->unique('username');
            }

            if (! in_array(['phone'], $uniqueColumns, true)) {
                $table->unique('phone');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropUnique(['phone']);
            $table->dropColumn(['username', 'phone']);
        });
    }
};
