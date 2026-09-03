<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\WalletService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Three demo accounts with a little history, plus the super administrator, so
     * the dashboard and the admin area both have something to show immediately
     * after a fresh install.
     *
     * Password for all of them: password123
     *
     * The administrator is delegated to AdminSeeder, which can also be run on its
     * own when a real deployment needs an operator but not demo wallets:
     *
     *     php artisan db:seed --class=AdminSeeder
     */
    public function run(): void
    {
        $wallets = app(WalletService::class);

        $demo = [
            ['name' => 'Ian Pratama', 'username' => 'ian', 'email' => 'ian@example.com', 'phone' => '081200000001'],
            ['name' => 'Budi Santoso', 'username' => 'budi', 'email' => 'budi@example.com', 'phone' => '081200000002'],
            ['name' => 'Citra Dewi', 'username' => 'citra', 'email' => 'citra@example.com', 'phone' => '081200000003'],
        ];

        $users = collect($demo)->map(function (array $attributes) use ($wallets): User {
            /** @var User $user */
            $user = User::factory()->create([
                ...$attributes,
                'password' => 'password123',
            ]);

            $wallets->walletFor($user);

            return $user;
        });

        [$ian, $budi, $citra] = [$users[0], $users[1], $users[2]];

        $wallets->topUp($ian, 500_000, 'Top up awal');
        $wallets->topUp($budi, 250_000, 'Top up awal');
        $wallets->topUp($citra, 100_000, 'Top up awal');

        $wallets->transfer($ian, $budi, 75_000, 'Bayar makan siang');
        $wallets->transfer($budi, $citra, 25_000, 'Split bill kopi');
        $wallets->transfer($citra, $ian, 10_000, 'Kembalian parkir');

        $this->call(AdminSeeder::class);
    }
}
