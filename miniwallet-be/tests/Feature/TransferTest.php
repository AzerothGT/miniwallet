<?php

use App\Enums\TransactionType;
use App\Exceptions\InsufficientBalanceException;
use App\Models\Transaction;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Support\Facades\DB;

test('a transfer moves money and records both sides of the mutation', function () {
    $sender = User::factory()->withWallet(100_000)->create();
    $recipient = User::factory()->withWallet(5_000)->create(['email' => 'penerima@example.com']);

    $this->actingAs($sender)
        ->postJson('/api/transfer', [
            'recipient' => 'penerima@example.com',
            'amount' => 30_000,
            'description' => 'Bayar makan siang',
        ])
        ->assertCreated()
        ->assertJsonPath('wallet.balance', 70_000)
        ->assertJsonPath('transaction.type', 'transfer_out')
        ->assertJsonPath('transaction.direction', 'out')
        ->assertJsonPath('transaction.signed_amount', -30_000);

    expect($sender->fresh()->wallet->balance)->toBe(70_000)
        ->and($recipient->fresh()->wallet->balance)->toBe(35_000);

    // Two rows, one per side, sharing a single reference.
    $transactions = Transaction::all();
    expect($transactions)->toHaveCount(2)
        ->and($transactions->pluck('reference')->unique())->toHaveCount(1);
});

test('a transfer can target the recipient by phone number', function () {
    $sender = User::factory()->withWallet(100_000)->create();
    $recipient = User::factory()->withWallet()->create(['phone' => '081298765432']);

    $this->actingAs($sender)
        ->postJson('/api/transfer', [
            'recipient' => '081298765432',
            'amount' => 25_000,
        ])
        ->assertCreated();

    expect($recipient->fresh()->wallet->balance)->toBe(25_000);
});

test('a transfer is refused when the balance is insufficient', function () {
    $sender = User::factory()->withWallet(10_000)->create();
    $recipient = User::factory()->withWallet(0)->create(['email' => 'penerima@example.com']);

    $this->actingAs($sender)
        ->postJson('/api/transfer', [
            'recipient' => 'penerima@example.com',
            'amount' => 50_000,
        ])
        ->assertStatus(400)
        ->assertJsonPath('code', 'insufficient_balance')
        ->assertJsonPath('message', 'Saldo tidak cukup untuk melakukan transaksi ini.')
        ->assertJsonPath('shortfall', 40_000);

    // Neither balance moved, and no half-written mutation was left behind.
    expect($sender->fresh()->wallet->balance)->toBe(10_000)
        ->and($recipient->fresh()->wallet->balance)->toBe(0);
    $this->assertDatabaseCount('transactions', 0);
});

test('a balance can never go negative', function () {
    $sender = User::factory()->withWallet(1_000)->create();
    $recipient = User::factory()->withWallet()->create(['email' => 'penerima@example.com']);

    $this->actingAs($sender)
        ->postJson('/api/transfer', [
            'recipient' => 'penerima@example.com',
            'amount' => 1_000_000,
        ])
        ->assertStatus(400);

    expect($sender->fresh()->wallet->balance)->toBeGreaterThanOrEqual(0);
});

test('a transfer to an unknown recipient is refused', function () {
    $sender = User::factory()->withWallet(100_000)->create();

    $this->actingAs($sender)
        ->postJson('/api/transfer', [
            'recipient' => 'tidakada@example.com',
            'amount' => 10_000,
        ])
        ->assertStatus(400)
        ->assertJsonPath('code', 'recipient_not_found');

    expect($sender->fresh()->wallet->balance)->toBe(100_000);
    $this->assertDatabaseCount('transactions', 0);
});

test('a user cannot transfer to themselves', function () {
    $sender = User::factory()->withWallet(100_000)->create(['email' => 'ian@example.com']);

    $this->actingAs($sender)
        ->postJson('/api/transfer', [
            'recipient' => 'ian@example.com',
            'amount' => 10_000,
        ])
        ->assertStatus(400)
        ->assertJsonPath('code', 'self_transfer');

    expect($sender->fresh()->wallet->balance)->toBe(100_000);
    $this->assertDatabaseCount('transactions', 0);
});

test('transfer rejects invalid amounts without writing to the database', function ($amount, string $expectedMessage) {
    $sender = User::factory()->withWallet(100_000)->create();
    User::factory()->withWallet()->create(['email' => 'penerima@example.com']);

    $this->actingAs($sender)
        ->postJson('/api/transfer', [
            'recipient' => 'penerima@example.com',
            'amount' => $amount,
        ])
        ->assertStatus(422)
        ->assertJsonPath('errors.amount.0', $expectedMessage);

    expect($sender->fresh()->wallet->balance)->toBe(100_000);
    $this->assertDatabaseCount('transactions', 0);
})->with('invalid amounts');

test('transfer requires a recipient', function () {
    $sender = User::factory()->withWallet(100_000)->create();

    $this->actingAs($sender)
        ->postJson('/api/transfer', ['amount' => 10_000])
        ->assertStatus(422)
        ->assertJsonPath('errors.recipient.0', 'Email atau nomor HP penerima tidak boleh kosong.');
});

test('transfer requires authentication', function () {
    User::factory()->withWallet()->create(['email' => 'penerima@example.com']);

    $this->postJson('/api/transfer', [
        'recipient' => 'penerima@example.com',
        'amount' => 10_000,
    ])->assertUnauthorized();

    $this->assertDatabaseCount('transactions', 0);
});

/*
 * The core integrity guarantee: if anything fails after the sender has been
 * debited, the whole operation must unwind. Here the failure is forced by
 * throwing while the transaction is still open.
 */
test('a failure midway through a transfer rolls back the debit', function () {
    $sender = User::factory()->withWallet(100_000)->create();
    $recipient = User::factory()->withWallet(20_000)->create();

    $service = app(WalletService::class);

    expect(fn () => DB::transaction(function () use ($service, $sender, $recipient) {
        $service->transfer($sender, $recipient, 30_000);

        throw new RuntimeException('Kegagalan setelah saldo terpotong');
    }))->toThrow(RuntimeException::class);

    expect($sender->fresh()->wallet->balance)->toBe(100_000)
        ->and($recipient->fresh()->wallet->balance)->toBe(20_000);
    $this->assertDatabaseCount('transactions', 0);
});

test('the service throws when the sender cannot cover the amount', function () {
    $sender = User::factory()->withWallet(5_000)->create();
    $recipient = User::factory()->withWallet()->create();

    expect(fn () => app(WalletService::class)->transfer($sender, $recipient, 10_000))
        ->toThrow(InsufficientBalanceException::class);

    expect($sender->fresh()->wallet->balance)->toBe(5_000);
    $this->assertDatabaseCount('transactions', 0);
});

test('balance_after reflects the running balance for each side', function () {
    $sender = User::factory()->withWallet(100_000)->create();
    $recipient = User::factory()->withWallet(20_000)->create();

    app(WalletService::class)->transfer($sender, $recipient, 30_000);

    $out = Transaction::where('user_id', $sender->id)->firstOrFail();
    $in = Transaction::where('user_id', $recipient->id)->firstOrFail();

    expect($out->type)->toBe(TransactionType::TransferOut)
        ->and($out->balance_after)->toBe(70_000)
        ->and($in->type)->toBe(TransactionType::TransferIn)
        ->and($in->balance_after)->toBe(50_000);
});
