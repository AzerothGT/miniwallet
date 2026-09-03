<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\AdminSeeder;

test('the seeder creates a super administrator with a wallet', function () {
    $this->seed(AdminSeeder::class);

    $admin = User::where('email', config('admin.email'))->firstOrFail();

    expect($admin->isAdmin())->toBeTrue()
        ->and($admin->role)->toBe(UserRole::Admin)
        ->and($admin->isSuspended())->toBeFalse()
        ->and($admin->username)->toBe(config('admin.username'))
        // The role grants oversight; it does not make the account a different
        // kind of thing, so it holds a wallet like anyone else.
        ->and($admin->wallet)->not->toBeNull()
        ->and($admin->wallet->balance)->toBe(0);
});

test('the seeded password is hashed and usable for login', function () {
    $this->seed(AdminSeeder::class);

    $admin = User::where('email', config('admin.email'))->firstOrFail();

    // Stored hashed, not in plain text.
    expect($admin->password)->not->toBe(config('admin.password'));

    $this->postJson('/api/login', [
        'email' => config('admin.email'),
        'password' => config('admin.password'),
    ])
        ->assertOk()
        ->assertJsonPath('user.is_admin', true)
        ->assertJsonPath('user.role', 'admin');
});

test('running the seeder twice creates only one administrator', function () {
    $this->seed(AdminSeeder::class);
    $this->seed(AdminSeeder::class);

    // A second run must not trip the unique email index, nor add a duplicate.
    expect(User::where('email', config('admin.email'))->count())->toBe(1)
        ->and(User::where('role', UserRole::Admin)->count())->toBe(1);
});

test('an existing account is promoted rather than duplicated', function () {
    $existing = User::factory()->withWallet(75_000)->create([
        'email' => config('admin.email'),
        'name' => 'Sudah Terdaftar',
    ]);

    $this->seed(AdminSeeder::class);

    $existing->refresh();

    expect($existing->isAdmin())->toBeTrue()
        // Promotion must not disturb the account's own data.
        ->and($existing->name)->toBe('Sudah Terdaftar')
        ->and($existing->wallet->balance)->toBe(75_000)
        ->and(User::count())->toBe(1);
});

/*
 * Resetting the password on promotion would silently undo a deliberate change by
 * the account owner, which is a worse failure than making an operator run one more
 * command to recover access.
 */
test('promotion leaves an existing password untouched', function () {
    User::factory()->withWallet()->create([
        'email' => config('admin.email'),
        'password' => 'passwordSendiri123',
    ]);

    $this->seed(AdminSeeder::class);

    $this->postJson('/api/login', [
        'email' => config('admin.email'),
        'password' => 'passwordSendiri123',
    ])->assertOk();

    $this->postJson('/api/login', [
        'email' => config('admin.email'),
        'password' => config('admin.password'),
    ])->assertStatus(422);
});

test('a suspended account is reactivated when promoted', function () {
    User::factory()->suspended()->withWallet()->create([
        'email' => config('admin.email'),
    ]);

    $this->seed(AdminSeeder::class);

    $admin = User::where('email', config('admin.email'))->firstOrFail();

    // An administrator who cannot act is of no use, so promotion clears the
    // suspension it would otherwise inherit.
    expect($admin->isAdmin())->toBeTrue()
        ->and($admin->isSuspended())->toBeFalse();
});

test('the identity is taken from configuration', function () {
    config([
        'admin.name' => 'Operator Produksi',
        'admin.username' => 'operator',
        'admin.email' => 'ops@miniwallet.test',
        'admin.phone' => '081298765432',
        'admin.password' => 'RahasiaSekali123',
    ]);

    $this->seed(AdminSeeder::class);

    $admin = User::where('email', 'ops@miniwallet.test')->firstOrFail();

    expect($admin->name)->toBe('Operator Produksi')
        ->and($admin->username)->toBe('operator')
        ->and($admin->phone)->toBe('081298765432')
        ->and($admin->isAdmin())->toBeTrue();

    $this->postJson('/api/login', [
        'email' => 'ops@miniwallet.test',
        'password' => 'RahasiaSekali123',
    ])->assertOk();
});

test('the full database seeder produces demo users and one administrator', function () {
    $this->seed();

    expect(User::count())->toBe(4)
        ->and(User::where('role', UserRole::Admin)->count())->toBe(1)
        ->and(User::where('role', UserRole::User)->count())->toBe(3);

    // Every account, administrator included, ends up with a wallet.
    expect(User::doesntHave('wallet')->count())->toBe(0);
});
