<?php

use App\Models\User;

test('a user can see their own balance', function () {
    $user = User::factory()->withWallet(125_000)->create();

    $this->actingAs($user)
        ->getJson('/api/wallet')
        ->assertOk()
        ->assertJsonPath('data.balance', 125_000)
        ->assertJsonPath('data.balance_formatted', 'Rp 125.000');
});

test('the wallet endpoint requires authentication', function () {
    $this->getJson('/api/wallet')
        ->assertUnauthorized()
        ->assertJsonPath('code', 'unauthenticated');
});

test('a top up increases the balance and records a transaction', function () {
    $user = User::factory()->withWallet(10_000)->create();

    $this->actingAs($user)
        ->postJson('/api/topup', ['amount' => 50_000])
        ->assertCreated()
        ->assertJsonPath('wallet.balance', 60_000)
        ->assertJsonPath('transaction.type', 'topup')
        ->assertJsonPath('transaction.direction', 'in')
        ->assertJsonPath('transaction.balance_after', 60_000);

    expect($user->fresh()->wallet->balance)->toBe(60_000);
    $this->assertDatabaseCount('transactions', 1);
});

/*
 * The guideline requires each invalid amount to produce a specific message and,
 * critically, to leave the database untouched. The dataset lives in
 * tests/Datasets/Amounts.php so the transfer suite asserts the same contract.
 */
test('top up rejects invalid amounts without writing to the database', function ($amount, string $expectedMessage) {
    $user = User::factory()->withWallet(10_000)->create();

    $this->actingAs($user)
        ->postJson('/api/topup', ['amount' => $amount])
        ->assertStatus(422)
        ->assertJsonPath('errors.amount.0', $expectedMessage);

    expect($user->fresh()->wallet->balance)->toBe(10_000);
    $this->assertDatabaseCount('transactions', 0);
})->with('invalid amounts');

test('top up requires authentication', function () {
    $this->postJson('/api/topup', ['amount' => 50_000])->assertUnauthorized();

    $this->assertDatabaseCount('transactions', 0);
});
