<?php

use App\Models\User;
use App\Services\WalletService;

test('a user only sees their own mutations', function () {
    $alice = User::factory()->withWallet(100_000)->create();
    $bob = User::factory()->withWallet(100_000)->create();
    $carol = User::factory()->withWallet(100_000)->create();

    $wallets = app(WalletService::class);

    // Money that has nothing to do with Alice.
    $wallets->topUp($bob, 75_000, 'Top up Bob');
    $wallets->transfer($bob, $carol, 25_000, 'Bob ke Carol');

    $wallets->topUp($alice, 50_000, 'Top up Alice');

    $response = $this->actingAs($alice)->getJson('/api/transactions');

    $response->assertOk()->assertJsonCount(1, 'data');

    expect($response->json('data.0.description'))->toBe('Top up Alice');

    // Nothing belonging to Bob or Carol may appear in Alice's payload.
    $body = $response->getContent();
    expect($body)->not->toContain('Top up Bob')
        ->and($body)->not->toContain('Bob ke Carol');
});

test('the history shows both incoming and outgoing money', function () {
    $alice = User::factory()->withWallet(0)->create();
    $bob = User::factory()->withWallet(100_000)->create();

    $wallets = app(WalletService::class);

    $wallets->topUp($alice, 100_000, 'Isi saldo');
    $wallets->transfer($alice, $bob, 30_000, 'Kirim ke Bob');
    $wallets->transfer($bob, $alice, 10_000, 'Terima dari Bob');

    $response = $this->actingAs($alice)->getJson('/api/transactions');

    $response->assertOk()->assertJsonCount(3, 'data');

    $directions = collect($response->json('data'))->pluck('direction')->sort()->values();
    expect($directions->all())->toBe(['in', 'in', 'out']);
});

test('the history can be filtered by type', function () {
    $alice = User::factory()->withWallet(0)->create();
    $bob = User::factory()->withWallet()->create();

    $wallets = app(WalletService::class);
    $wallets->topUp($alice, 100_000);
    $wallets->transfer($alice, $bob, 20_000);

    $this->actingAs($alice)
        ->getJson('/api/transactions?type=transfer_out')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'transfer_out');
});

test('an unknown type filter is ignored rather than returning nothing', function () {
    $alice = User::factory()->withWallet(0)->create();
    app(WalletService::class)->topUp($alice, 100_000);

    $this->actingAs($alice)
        ->getJson('/api/transactions?type=nonsense')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('the history is paginated and newest first', function () {
    $alice = User::factory()->withWallet(0)->create();
    $wallets = app(WalletService::class);

    foreach (range(1, 5) as $i) {
        $wallets->topUp($alice, $i * 1_000, "Top up ke-{$i}");
    }

    $response = $this->actingAs($alice)->getJson('/api/transactions?per_page=2');

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.total', 5)
        ->assertJsonPath('data.0.description', 'Top up ke-5');
});

test('the transactions endpoint requires authentication', function () {
    $this->getJson('/api/transactions')->assertUnauthorized();
});
