<?php

use App\Enums\ActivityEvent;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\WalletService;

test('registration is recorded', function () {
    $this->postJson('/api/register', [
        'name' => 'Ian Pratama',
        'username' => 'ianpratama',
        'email' => 'ian@example.com',
        'phone' => '081234567890',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertCreated();

    $log = ActivityLog::where('event', ActivityEvent::Registered)->firstOrFail();

    expect($log->description)->toContain('ianpratama')
        ->and($log->user_id)->toBe(User::where('email', 'ian@example.com')->value('id'))
        ->and($log->ip_address)->not->toBeNull();
});

test('a successful login is recorded', function () {
    $user = User::factory()->withWallet()->create([
        'email' => 'ian@example.com',
        'password' => 'password123',
    ]);

    $this->postJson('/api/login', [
        'email' => 'ian@example.com',
        'password' => 'password123',
    ])->assertOk();

    $log = ActivityLog::where('event', ActivityEvent::LoggedIn)->firstOrFail();

    expect($log->user_id)->toBe($user->id);
});

/*
 * Repeated attempts against addresses that match no account are what separate a
 * guessing attack from someone mistyping their own password, so both cases are
 * kept — and the submitted password never is.
 */
test('a failed login is recorded, with or without a matching account', function () {
    User::factory()->withWallet()->create([
        'email' => 'ian@example.com',
        'password' => 'password123',
    ]);

    $this->postJson('/api/login', [
        'email' => 'ian@example.com',
        'password' => 'salahbanget',
    ])->assertStatus(422);

    $this->postJson('/api/login', [
        'email' => 'tidakada@example.com',
        'password' => 'apapun',
    ])->assertStatus(422);

    $logs = ActivityLog::where('event', ActivityEvent::LoginFailed)
        ->orderBy('id')
        ->get();

    expect($logs)->toHaveCount(2)
        ->and($logs[0]->user_id)->not->toBeNull()
        ->and($logs[0]->properties['akun_terdaftar'])->toBeTrue()
        ->and($logs[1]->user_id)->toBeNull()
        ->and($logs[1]->properties['akun_terdaftar'])->toBeFalse()
        ->and($logs[1]->properties['email'])->toBe('tidakada@example.com');
});

test('a submitted password never reaches the log', function () {
    User::factory()->withWallet()->create(['email' => 'ian@example.com']);

    $this->postJson('/api/login', [
        'email' => 'ian@example.com',
        'password' => 'RahasiaBanget123',
    ])->assertStatus(422);

    // Checked across every column, not just the properties payload.
    $rows = ActivityLog::all()->map(fn (ActivityLog $log) => json_encode($log->toArray()));

    expect($rows->implode(' '))->not->toContain('RahasiaBanget123');
});

test('logout is recorded', function () {
    $user = User::factory()->withWallet()->create();

    $this->actingAs($user)->postJson('/api/logout')->assertOk();

    expect(ActivityLog::where('event', ActivityEvent::LoggedOut)->value('user_id'))
        ->toBe($user->id);
});

test('a top up is recorded with its amount and resulting balance', function () {
    $user = User::factory()->withWallet(10_000)->create();

    $this->actingAs($user)
        ->postJson('/api/topup', ['amount' => 50_000])
        ->assertCreated();

    $log = ActivityLog::where('event', ActivityEvent::ToppedUp)->firstOrFail();

    expect($log->user_id)->toBe($user->id)
        ->and($log->properties['nominal'])->toBe(50_000)
        ->and($log->properties['saldo_akhir'])->toBe(60_000);
});

test('a transfer is recorded once, naming both parties', function () {
    $sender = User::factory()->withWallet(100_000)->create(['name' => 'Ian']);
    $recipient = User::factory()->withWallet()->create([
        'name' => 'Budi',
        'username' => 'budi',
        'email' => 'budi@example.com',
    ]);

    $this->actingAs($sender)
        ->postJson('/api/transfer', [
            'recipient' => 'budi@example.com',
            'amount' => 30_000,
        ])
        ->assertCreated();

    $logs = ActivityLog::where('event', ActivityEvent::TransferSent)->get();

    // The ledger holds two rows for a transfer; the audit trail holds one action.
    expect($logs)->toHaveCount(1)
        ->and($logs[0]->user_id)->toBe($sender->id)
        ->and($logs[0]->description)->toContain('Ian')
        ->and($logs[0]->description)->toContain('Budi')
        ->and($logs[0]->properties['penerima'])->toBe('budi')
        ->and($logs[0]->properties['nominal'])->toBe(30_000);
});

/*
 * The guarantee that makes the trail trustworthy: the entry is written inside the
 * same transaction as the money, so a rollback takes both.
 */
test('a rolled back transfer leaves no log entry', function () {
    $sender = User::factory()->withWallet(100_000)->create();
    $recipient = User::factory()->withWallet(20_000)->create();

    $service = app(WalletService::class);

    expect(fn () => DB::transaction(function () use ($service, $sender, $recipient) {
        $service->transfer($sender, $recipient, 30_000);

        throw new RuntimeException('Kegagalan setelah saldo terpotong');
    }))->toThrow(RuntimeException::class);

    expect($sender->fresh()->wallet->balance)->toBe(100_000)
        ->and(ActivityLog::where('event', ActivityEvent::TransferSent)->count())->toBe(0);
});

test('a refused transfer is not recorded as having happened', function () {
    $sender = User::factory()->withWallet(10_000)->create();
    User::factory()->withWallet()->create(['email' => 'budi@example.com']);

    $this->actingAs($sender)
        ->postJson('/api/transfer', [
            'recipient' => 'budi@example.com',
            'amount' => 50_000,
        ])
        ->assertStatus(400);

    expect(ActivityLog::where('event', ActivityEvent::TransferSent)->count())->toBe(0);
});

test('suspension and reactivation record the administrator as the actor', function () {
    $admin = User::factory()->admin()->withWallet()->create(['name' => 'Super Admin']);
    $target = User::factory()->withWallet()->create(['username' => 'budi']);

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$target->id}/suspension", ['suspended' => true])
        ->assertOk();

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$target->id}/suspension", ['suspended' => false])
        ->assertOk();

    $suspended = ActivityLog::where('event', ActivityEvent::UserSuspended)->firstOrFail();
    $reactivated = ActivityLog::where('event', ActivityEvent::UserReactivated)->firstOrFail();

    // The subject and the person responsible are recorded separately.
    expect($suspended->user_id)->toBe($target->id)
        ->and($suspended->actor_id)->toBe($admin->id)
        ->and($suspended->description)->toContain('budi')
        ->and($suspended->description)->toContain('Super Admin')
        ->and($reactivated->user_id)->toBe($target->id)
        ->and($reactivated->actor_id)->toBe($admin->id);
});

test('a role change records what it changed from and to', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $target = User::factory()->withWallet()->create();

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$target->id}/role", ['role' => 'admin'])
        ->assertOk();

    $log = ActivityLog::where('event', ActivityEvent::RoleChanged)->firstOrFail();

    expect($log->properties['peran_lama'])->toBe('Pengguna')
        ->and($log->properties['peran_baru'])->toBe('Super Administrator')
        ->and($log->actor_id)->toBe($admin->id);
});

/*
 * An audit trail is only worth reading if it cannot be quietly rewritten.
 */
test('a log entry cannot be updated', function () {
    $log = ActivityLog::factory()->create();

    expect(function () use ($log) {
        $log->description = 'Diubah';
        $log->save();
    })->toThrow(RuntimeException::class);

    expect($log->fresh()->description)->not->toBe('Diubah');
});

test('a log entry cannot be deleted', function () {
    $log = ActivityLog::factory()->create();

    expect(fn () => $log->delete())->toThrow(RuntimeException::class);

    expect(ActivityLog::whereKey($log->id)->exists())->toBeTrue();
});

test('a log row carries no updated_at', function () {
    $log = ActivityLog::factory()->create();

    // A column that could only ever lie is better left out of the schema.
    expect($log->getAttributes())->not->toHaveKey('updated_at')
        ->and(Schema::hasColumn('activity_logs', 'updated_at'))->toBeFalse();
});
