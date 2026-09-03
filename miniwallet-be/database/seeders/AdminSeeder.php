<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Creates the first super administrator.
 *
 * Deliberately standalone, so a real deployment can bootstrap an operator without
 * also inserting demo wallets:
 *
 *     php artisan db:seed --class=AdminSeeder
 *
 * Two constraints shape this class:
 *
 * 1. No factory. `fakerphp/faker` is a dev dependency, so `User::factory()` does
 *    not exist after `composer install --no-dev`. Models are built directly.
 *
 * 2. Idempotent. Running it twice must not fail on the unique email index, and
 *    must not create a second administrator. An existing account is promoted and
 *    reactivated instead.
 *
 * Credentials come from the environment. The defaults are only intended for local
 * work, and the seeder says so out loud when it uses them.
 */
class AdminSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $email = (string) config('admin.email');
        $password = (string) config('admin.password');

        $existing = User::query()->where('email', $email)->first();

        $admin = $existing
            ? $this->promote($existing)
            : $this->create($email, $password);

        // The role grants oversight; it does not make the account a different
        // kind of thing, so an administrator holds a wallet like anyone else.
        app(WalletService::class)->walletFor($admin);

        $this->report($admin, $password, promoted: $existing !== null);
    }

    /**
     * Bring an existing account up to administrator, leaving its password alone.
     *
     * Resetting the password here would silently undo a deliberate change by the
     * account owner, which is a worse failure than making the operator run one
     * more command to recover access.
     */
    private function promote(User $user): User
    {
        $user->role = UserRole::Admin;
        $user->suspended_at = null;
        $user->save();

        return $user;
    }

    private function create(string $email, string $password): User
    {
        /** @var User $admin */
        $admin = User::create([
            'name' => (string) config('admin.name'),
            'username' => (string) config('admin.username'),
            'email' => $email,
            'phone' => (string) config('admin.phone'),
            'password' => $password,
        ]);

        // `role` is not fillable: privilege may only change through an explicit
        // assignment, never through mass assignment from request data.
        $admin->role = UserRole::Admin;
        $admin->save();

        return $admin;
    }

    /**
     * Report what happened to the operator.
     *
     * Assumes the seeder was invoked through Artisan, which is the only way it is
     * reached here (`db:seed`, or `$this->call()` from DatabaseSeeder). Laravel
     * sets `$command` on that path; constructing the class by hand and calling
     * `run()` would not, and would fail loudly on the first line.
     */
    private function report(User $admin, string $password, bool $promoted): void
    {
        $this->command->info(
            $promoted
                ? "Akun {$admin->email} dipromosikan menjadi super administrator."
                : "Super administrator dibuat: {$admin->email}",
        );

        if ($promoted) {
            $this->command->line('  Password tidak diubah.');

            return;
        }

        if ($password === config('admin.default_password')) {
            $this->command->warn(
                '  Password masih memakai nilai default. Setel ADMIN_PASSWORD '.
                'sebelum dipakai di luar lingkungan lokal.',
            );
        }
    }
}
