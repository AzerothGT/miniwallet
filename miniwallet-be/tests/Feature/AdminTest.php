<?php

use App\Enums\UserRole;
use App\Models\User;
use App\Services\WalletService;

test('an administrator can read platform statistics', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    User::factory()->withWallet(50_000)->count(2)->create();

    $response = $this->actingAs($admin)->getJson('/api/admin/stats');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'users' => ['total', 'admins', 'suspended', 'new_this_week'],
                'wallets' => ['total_balance'],
                'transactions' => ['total', 'topup', 'transfer'],
                'daily',
            ],
        ])
        ->assertJsonPath('data.users.total', 3)
        ->assertJsonPath('data.users.admins', 1)
        ->assertJsonPath('data.wallets.total_balance', 100_000);
});

test('transfer volume counts the movement once, not both legs', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $alice = User::factory()->withWallet(100_000)->create();
    $bob = User::factory()->withWallet()->create();

    app(WalletService::class)->transfer($alice, $bob, 30_000);

    // The ledger holds two rows for this transfer; the reported volume must be
    // 30.000, not 60.000.
    $this->actingAs($admin)
        ->getJson('/api/admin/stats')
        ->assertOk()
        ->assertJsonPath('data.transactions.total', 2)
        ->assertJsonPath('data.transactions.transfer.count', 1)
        ->assertJsonPath('data.transactions.transfer.total', 30_000);
});

test('an ordinary user cannot reach the admin area', function () {
    $user = User::factory()->withWallet()->create();

    foreach (['/api/admin/stats', '/api/admin/users', '/api/admin/transactions'] as $path) {
        $this->actingAs($user)
            ->getJson($path)
            ->assertForbidden()
            ->assertJsonPath('code', 'forbidden');
    }
});

test('the admin area requires authentication', function () {
    $this->getJson('/api/admin/stats')->assertUnauthorized();
    $this->getJson('/api/admin/users')->assertUnauthorized();
});

test('an administrator can list and search users', function () {
    // Every searchable field is set explicitly: with faker values, a random name
    // or email could contain the search term and make this test flaky.
    $admin = User::factory()->admin()->withWallet()->create([
        'name' => 'Admin Utama',
        'username' => 'admin',
        'email' => 'admin@example.com',
        'phone' => '081200000000',
    ]);

    User::factory()->withWallet()->create([
        'name' => 'Budi Santoso',
        'username' => 'budi',
        'email' => 'budi@example.com',
        'phone' => '081200000002',
    ]);

    User::factory()->withWallet()->create([
        'name' => 'Citra Dewi',
        'username' => 'citra',
        'email' => 'citra@example.com',
        'phone' => '081200000003',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/admin/users')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure([
            'data' => [['id', 'name', 'username', 'email', 'role', 'suspended', 'balance']],
        ]);

    $this->actingAs($admin)
        ->getJson('/api/admin/users?search=budi')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.username', 'budi');

    // Phone numbers are searchable too.
    $this->actingAs($admin)
        ->getJson('/api/admin/users?search=081200000003')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.username', 'citra');
});

test('searching does not leak past the role filter', function () {
    $admin = User::factory()->admin()->withWallet()->create([
        'name' => 'Admin Satu',
        'username' => 'adminsatu',
        'email' => 'satu@example.com',
        'phone' => '081200000011',
    ]);

    User::factory()->withWallet()->create([
        'name' => 'Admin Palsu',
        'username' => 'adminpalsu',
        'email' => 'palsu@example.com',
        'phone' => '081200000012',
    ]);

    /*
     * Both names match "Admin", but only one holds the role. Without grouping the
     * OR conditions, the search would escape the filter and return both.
     */
    $this->actingAs($admin)
        ->getJson('/api/admin/users?search=Admin&role=admin')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $admin->id);
});

test('users can be filtered by suspension state', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    User::factory()->suspended()->withWallet()->create();
    User::factory()->withWallet()->create();

    $this->actingAs($admin)
        ->getJson('/api/admin/users?status=suspended')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.suspended', true);

    $this->actingAs($admin)
        ->getJson('/api/admin/users?status=active')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('an administrator can suspend a user, revoking their tokens', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $target = User::factory()->withWallet(50_000)->create();

    $target->createToken('spa');
    expect($target->tokens()->count())->toBe(1);

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$target->id}/suspension", ['suspended' => true])
        ->assertOk()
        ->assertJsonPath('data.suspended', true);

    expect($target->fresh()->isSuspended())->toBeTrue()
        // An existing token must not keep working after suspension.
        ->and($target->tokens()->count())->toBe(0);
});

test('a suspended user cannot move money but can still see why', function () {
    $suspended = User::factory()->suspended()->withWallet(100_000)->create();

    $this->actingAs($suspended)
        ->getJson('/api/wallet')
        ->assertForbidden()
        ->assertJsonPath('code', 'account_suspended');

    $this->actingAs($suspended)
        ->postJson('/api/topup', ['amount' => 50_000])
        ->assertForbidden();

    $this->actingAs($suspended)
        ->getJson('/api/transactions')
        ->assertForbidden();

    // Still able to learn their status and sign out.
    $this->actingAs($suspended)->getJson('/api/me')->assertOk();

    $this->assertDatabaseCount('transactions', 0);
});

test('a suspended user can be reactivated', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $target = User::factory()->suspended()->withWallet()->create();

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$target->id}/suspension", ['suspended' => false])
        ->assertOk()
        ->assertJsonPath('data.suspended', false);

    expect($target->fresh()->isSuspended())->toBeFalse();

    $this->actingAs($target->fresh())->getJson('/api/wallet')->assertOk();
});

test('an administrator cannot suspend their own account', function () {
    $admin = User::factory()->admin()->withWallet()->create();

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$admin->id}/suspension", ['suspended' => true])
        ->assertStatus(422)
        ->assertJsonPath('code', 'self_moderation');

    expect($admin->fresh()->isSuspended())->toBeFalse();
});

test('an administrator can change another user role', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $target = User::factory()->withWallet()->create();

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$target->id}/role", ['role' => 'admin'])
        ->assertOk()
        ->assertJsonPath('data.role', 'admin');

    expect($target->fresh()->role)->toBe(UserRole::Admin);
});

test('an administrator cannot change their own role', function () {
    $admin = User::factory()->admin()->withWallet()->create();

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$admin->id}/role", ['role' => 'user'])
        ->assertStatus(422)
        ->assertJsonPath('code', 'self_moderation');

    expect($admin->fresh()->role)->toBe(UserRole::Admin);
});

test('an unknown role is rejected', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $target = User::factory()->withWallet()->create();

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$target->id}/role", ['role' => 'superuser'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['role']);

    expect($target->fresh()->role)->toBe(UserRole::User);
});

test('registration cannot grant a role or bypass suspension', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Penyusup',
        'username' => 'penyusup',
        'email' => 'penyusup@example.com',
        'phone' => '081299999999',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        // Neither field is fillable; both must be ignored.
        'role' => 'admin',
        'suspended_at' => null,
    ]);

    $response->assertCreated();

    $user = User::where('email', 'penyusup@example.com')->firstOrFail();

    expect($user->role)->toBe(UserRole::User)
        ->and($user->isAdmin())->toBeFalse();
});

test('the admin ledger shows both sides of a transfer', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $alice = User::factory()->withWallet(100_000)->create();
    $bob = User::factory()->withWallet()->create();

    app(WalletService::class)->transfer($alice, $bob, 30_000, 'Bayar kopi');

    $response = $this->actingAs($admin)
        ->getJson('/api/admin/transactions')
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $types = collect($response->json('data'))->pluck('type')->sort()->values();
    expect($types->all())->toBe(['transfer_in', 'transfer_out']);

    // Unlike the user-facing resource, each row names its owner.
    expect($response->json('data.0.owner.id'))->not->toBeNull();
});

test('the admin ledger can be filtered to one user', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $alice = User::factory()->withWallet(100_000)->create();
    $bob = User::factory()->withWallet()->create();
    $carol = User::factory()->withWallet(100_000)->create();

    $wallets = app(WalletService::class);
    $wallets->transfer($alice, $bob, 10_000);
    $wallets->topUp($carol, 20_000);

    // Both legs of Alice's transfer involve her, one as owner and one as
    // counterpart.
    $this->actingAs($admin)
        ->getJson("/api/admin/transactions?user_id={$alice->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $this->actingAs($admin)
        ->getJson("/api/admin/transactions?user_id={$carol->id}")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'topup');
});

test('the current user payload states whether they are an administrator', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $user = User::factory()->withWallet()->create();

    $this->actingAs($admin)
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('user.is_admin', true)
        ->assertJsonPath('user.role', 'admin');

    $this->actingAs($user)
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('user.is_admin', false);
});
