<?php

use App\Models\User;

test('user can register and receives a token plus an httpOnly cookie', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Ian Pratama',
        'username' => 'ianpratama',
        'email' => 'ian@example.com',
        'phone' => '081234567890',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['message', 'token', 'user' => ['id', 'name', 'username', 'email', 'phone']]);

    $user = User::where('email', 'ian@example.com')->firstOrFail();

    // Registration must also provision the wallet, at zero balance.
    expect($user->wallet)->not->toBeNull()
        ->and($user->wallet->balance)->toBe(0);

    $cookie = collect($response->headers->getCookies())
        ->firstWhere(fn ($c) => $c->getName() === config('auth_cookie.name'));

    expect($cookie)->not->toBeNull()
        ->and($cookie->isHttpOnly())->toBeTrue();
});

test('registration rejects an email without a valid format', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Ian',
        'username' => 'ian',
        'email' => 'user@',
        'phone' => '081234567890',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email'])
        ->assertJsonPath('errors.email.0', 'Format email tidak valid.');

    expect(User::count())->toBe(0);
});

test('registration rejects a password shorter than 8 characters', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Ian',
        'username' => 'ian',
        'email' => 'ian@example.com',
        'phone' => '081234567890',
        'password' => 'pass123',
        'password_confirmation' => 'pass123',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('errors.password.0', 'Password minimal 8 karakter.');

    expect(User::count())->toBe(0);
});

test('registration rejects a username that is already taken', function () {
    User::factory()->create(['username' => 'ianpratama']);

    $response = $this->postJson('/api/register', [
        'name' => 'Ian Kedua',
        'username' => 'ianpratama',
        'email' => 'ian2@example.com',
        'phone' => '081234567891',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('errors.username.0', 'Username sudah digunakan.');

    expect(User::count())->toBe(1);
});

test('user can log in with valid credentials', function () {
    $user = User::factory()->withWallet()->create([
        'email' => 'ian@example.com',
        'password' => 'password123',
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'ian@example.com',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonStructure(['token']);
});

test('login fails with the wrong password and does not leak whether the email exists', function () {
    User::factory()->create([
        'email' => 'ian@example.com',
        'password' => 'password123',
    ]);

    $wrongPassword = $this->postJson('/api/login', [
        'email' => 'ian@example.com',
        'password' => 'salahbanget',
    ]);

    $unknownEmail = $this->postJson('/api/login', [
        'email' => 'tidakada@example.com',
        'password' => 'password123',
    ]);

    $wrongPassword->assertStatus(422)
        ->assertJsonPath('errors.email.0', 'Email atau password salah.');

    $unknownEmail->assertStatus(422)
        ->assertJsonPath('errors.email.0', 'Email atau password salah.');
});

test('the token in the httpOnly cookie authenticates subsequent requests', function () {
    $user = User::factory()->withWallet(50_000)->create([
        'email' => 'ian@example.com',
        'password' => 'password123',
    ]);

    $login = $this->postJson('/api/login', [
        'email' => 'ian@example.com',
        'password' => 'password123',
    ]);

    $token = $login->json('token');

    // withCredentials() mirrors the browser: cookies are only attached to a
    // cross-origin JSON request when the client opts in. No Authorization
    // header is set here, so the cookie alone has to carry the authentication.
    $response = $this->withCredentials()
        ->withUnencryptedCookie(config('auth_cookie.name'), $token)
        ->getJson('/api/wallet');

    $response->assertOk()->assertJsonPath('data.balance', 50_000);
});

test('logout revokes the current token and clears the cookie', function () {
    $user = User::factory()->withWallet()->create();
    $token = $user->createToken('spa')->plainTextToken;

    $response = $this->withToken($token)->postJson('/api/logout');

    $response->assertOk();
    expect($user->tokens()->count())->toBe(0);

    // The guard caches the resolved user per application instance, which a real
    // request would never do. Forget it so the revoked token is re-checked.
    $this->app['auth']->forgetGuards();

    $this->withToken($token)->getJson('/api/wallet')->assertUnauthorized();
});
