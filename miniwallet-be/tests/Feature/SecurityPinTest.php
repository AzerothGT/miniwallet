<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('the profile exposes only whether a security pin exists', function () {
    $withoutPin = User::factory()->create();
    $withPin = User::factory()->create([
        'security_pin' => Hash::make('123456'),
    ]);

    $this->actingAs($withoutPin)
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('user.has_security_pin', false)
        ->assertJsonMissingPath('user.security_pin');

    $this->actingAs($withPin)
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('user.has_security_pin', true)
        ->assertJsonMissingPath('user.security_pin');
});

test('a user can create a six digit security pin once', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/security-pin', [
            'pin' => '123456',
            'pin_confirmation' => '123456',
        ])
        ->assertCreated()
        ->assertJsonPath('message', 'Security PIN berhasil dibuat.');

    expect(Hash::check('123456', $user->fresh()->security_pin))->toBeTrue();
});

test('security pin setup rejects malformed or mismatched pins', function (array $payload, string $field) {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/security-pin', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);
})->with([
    'too short' => [['pin' => '12345', 'pin_confirmation' => '12345'], 'pin'],
    'non numeric' => [['pin' => '12a456', 'pin_confirmation' => '12a456'], 'pin'],
    'mismatched' => [['pin' => '123456', 'pin_confirmation' => '654321'], 'pin'],
]);

test('security pin cannot be overwritten once created', function () {
    $user = User::factory()->create(['security_pin' => Hash::make('123456')]);

    $this->actingAs($user)
        ->postJson('/api/security-pin', [
            'pin' => '654321',
            'pin_confirmation' => '654321',
        ])
        ->assertStatus(409)
        ->assertJsonPath('code', 'security_pin_exists');

    expect(Hash::check('123456', $user->fresh()->security_pin))->toBeTrue();
});
