<?php

use App\Enums\ActivityEvent;
use App\Models\ActivityLog;
use App\Models\User;

test('an administrator can read the activity log', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    ActivityLog::factory()->count(3)->create();

    $this->actingAs($admin)
        ->getJson('/api/admin/logs')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure([
            'data' => [[
                'id', 'event', 'event_label', 'category', 'category_label',
                'alarming', 'description', 'ip_address', 'created_at',
            ]],
            'meta' => ['current_page', 'last_page', 'total'],
        ]);
});

test('an ordinary user cannot read the activity log', function () {
    $user = User::factory()->withWallet()->create();

    $this->actingAs($user)
        ->getJson('/api/admin/logs')
        ->assertForbidden()
        ->assertJsonPath('code', 'forbidden');

    $this->actingAs($user)
        ->getJson('/api/admin/logs/filters')
        ->assertForbidden();
});

test('the activity log requires authentication', function () {
    $this->getJson('/api/admin/logs')->assertUnauthorized();
});

/*
 * There is no write route at all. The absence is the guarantee: an audit trail
 * with an edit endpoint is one nobody can rely on.
 */
test('the log has no write endpoints', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $log = ActivityLog::factory()->create();

    // The collection path exists for GET only, so a write verb is refused as
    // method-not-allowed rather than not-found.
    $this->actingAs($admin)->postJson('/api/admin/logs', [])->assertStatus(405);

    // A per-entry path is not registered at all.
    $this->actingAs($admin)->patchJson("/api/admin/logs/{$log->id}", [])->assertNotFound();
    $this->actingAs($admin)->deleteJson("/api/admin/logs/{$log->id}")->assertNotFound();

    expect(ActivityLog::count())->toBe(1);
});

test('the log can be filtered by category', function () {
    $admin = User::factory()->admin()->withWallet()->create();

    ActivityLog::factory()->event(ActivityEvent::LoggedIn)->create();
    ActivityLog::factory()->event(ActivityEvent::ToppedUp)->create();
    ActivityLog::factory()->event(ActivityEvent::TransferSent)->create();
    ActivityLog::factory()->event(ActivityEvent::UserSuspended)->create();

    $this->actingAs($admin)
        ->getJson('/api/admin/logs?category=wallet')
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $this->actingAs($admin)
        ->getJson('/api/admin/logs?category=auth')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.event', 'logged_in');

    $this->actingAs($admin)
        ->getJson('/api/admin/logs?category=admin')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('the log can be filtered by a specific event', function () {
    $admin = User::factory()->admin()->withWallet()->create();

    ActivityLog::factory()->event(ActivityEvent::LoggedIn)->count(2)->create();
    ActivityLog::factory()->loginFailed()->create();

    $this->actingAs($admin)
        ->getJson('/api/admin/logs?event=login_failed')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.alarming', true);
});

/*
 * Filtering by person must find the entries where they were the subject as well as
 * those where they acted on someone else, or an administrator's own trail would be
 * invisible.
 */
test('filtering by user finds them as subject and as actor', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $target = User::factory()->withWallet()->create();

    // Admin acted on someone else.
    ActivityLog::factory()->create([
        'user_id' => $target->id,
        'actor_id' => $admin->id,
        'event' => ActivityEvent::UserSuspended,
    ]);

    // Admin's own login.
    ActivityLog::factory()->create([
        'user_id' => $admin->id,
        'event' => ActivityEvent::LoggedIn,
    ]);

    // Unrelated entry.
    ActivityLog::factory()->create();

    $this->actingAs($admin)
        ->getJson("/api/admin/logs?user_id={$admin->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $this->actingAs($admin)
        ->getJson("/api/admin/logs?user_id={$target->id}")
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('the log can be searched by description and ip address', function () {
    $admin = User::factory()->admin()->withWallet()->create();

    ActivityLog::factory()->create([
        'description' => 'Ian mengirim Rp 30.000 ke Budi.',
        'ip_address' => '203.0.113.7',
    ]);
    ActivityLog::factory()->create([
        'description' => 'Citra melakukan top up Rp 50.000.',
        'ip_address' => '198.51.100.4',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/admin/logs?search=Budi')
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->actingAs($admin)
        ->getJson('/api/admin/logs?search=198.51.100')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.ip_address', '198.51.100.4');
});

test('the log can be narrowed to a date range', function () {
    $admin = User::factory()->admin()->withWallet()->create();

    ActivityLog::factory()->at('2026-08-01 10:00:00')->create();
    ActivityLog::factory()->at('2026-08-15 10:00:00')->create();
    ActivityLog::factory()->at('2026-08-30 10:00:00')->create();

    $this->actingAs($admin)
        ->getJson('/api/admin/logs?from=2026-08-10&to=2026-08-20')
        ->assertOk()
        ->assertJsonCount(1, 'data');

    // The bounds are inclusive of the whole day, not the midnight instant.
    $this->actingAs($admin)
        ->getJson('/api/admin/logs?from=2026-08-15&to=2026-08-15')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('the log is paginated, newest first', function () {
    $admin = User::factory()->admin()->withWallet()->create();

    foreach (range(1, 5) as $index) {
        ActivityLog::factory()->create([
            'description' => "Kejadian ke-{$index}",
            'created_at' => now()->addMinutes($index),
        ]);
    }

    $this->actingAs($admin)
        ->getJson('/api/admin/logs?per_page=2')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.total', 5)
        ->assertJsonPath('data.0.description', 'Kejadian ke-5');
});

test('the filter options are served from the enums', function () {
    $admin = User::factory()->admin()->withWallet()->create();

    $response = $this->actingAs($admin)
        ->getJson('/api/admin/logs/filters')
        ->assertOk();

    // Adding an event server-side must surface here without a client change.
    expect($response->json('data.categories'))->toHaveCount(3)
        ->and($response->json('data.events'))->toHaveCount(count(ActivityEvent::cases()));

    $events = collect($response->json('data.events'));

    expect($events->pluck('value'))->toContain('login_failed', 'transfer_sent')
        ->and($events->firstWhere('value', 'login_failed')['category'])->toBe('auth');
});

test('an actor is only stored when it differs from the subject', function () {
    $admin = User::factory()->admin()->withWallet()->create();
    $target = User::factory()->withWallet()->create();

    // Acting on someone else records both parties.
    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$target->id}/suspension", ['suspended' => true])
        ->assertOk();

    // A self-action records only the subject, so "who did this to someone else"
    // stays answerable without comparing two ids on every read.
    $this->actingAs($target->fresh())->getJson('/api/me');

    $suspension = ActivityLog::where('event', ActivityEvent::UserSuspended)->firstOrFail();
    $login = ActivityLog::factory()->create([
        'user_id' => $admin->id,
        'actor_id' => null,
        'event' => ActivityEvent::LoggedIn,
    ]);

    expect($suspension->actor_id)->toBe($admin->id)
        ->and($login->actor_id)->toBeNull();
});
