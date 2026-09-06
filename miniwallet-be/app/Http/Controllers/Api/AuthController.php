<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\AuthCookieFactory;
use App\Services\WalletService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

#[Group(
    name: 'Authentication',
    description: 'Registration, login, profile, and logout. These endpoints are the entry point to the entire API.',
    weight: 1,
)]
class AuthController extends Controller
{
    public function __construct(
        private readonly WalletService $wallets,
        private readonly AuthCookieFactory $cookies,
        private readonly ActivityLogger $activity,
    ) {}

    /**
     * Register an account
     *
     * Creates an account and its wallet within a single database transaction, so
     * a user can never exist without a wallet to hold their funds.
     *
     * The Sanctum token is returned in the response body (for API clients and the
     * "Try it" button on this page) and also set as an `httpOnly` cookie (for
     * browser-based SPAs).
     *
     * The `role` and `suspended_at` fields cannot be set through this endpoint.
     * New accounts always have the `user` role and an active status.
     *
     * @response 201 array{message: string, token: string, user: array{id: int, name: string, username: string, email: string, phone: string, role: string, is_admin: bool}}
     * @response 422 array{message: string, errors: array<string, array<int, string>>}
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request): User {
            /** @var User $user */
            $user = User::create([
                'name' => $request->string('name')->toString(),
                'username' => $request->string('username')->toString(),
                'email' => $request->string('email')->toString(),
                'phone' => $request->string('phone')->toString(),
                'password' => $request->string('password')->toString(),
            ]);

            $this->wallets->walletFor($user);

            return $user;
        });

        $this->activity->registered($user);

        $token = $user->createToken('spa')->plainTextToken;

        return response()
            ->json([
                'message' => 'Registrasi berhasil.',
                'token' => $token,
                'user' => new UserResource($user),
            ], 201)
            ->withCookie($this->cookies->make($token));
    }

    /**
     * Log in
     *
     * Returns a Sanctum token and sets it as an `httpOnly` cookie.
     *
     * Unknown emails and incorrect passwords produce exactly the same message.
     * Distinguishing between them would allow an attacker to determine which
     * accounts are registered.
     *
     * @response 200 array{message: string, token: string, user: array{id: int, name: string, username: string, email: string, phone: string, role: string, is_admin: bool}}
     * @response 422 array{message: string, errors: array<string, array<int, string>>}
     */
    public function login(LoginRequest $request): JsonResponse
    {
        /** @var User|null $user */
        $user = User::query()
            ->where('email', $request->string('email')->toString())
            ->first();

        // A single generic message for both unknown email and wrong password:
        // distinguishing them would let an attacker enumerate valid accounts.
        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            // Recorded either way. Repeated attempts against addresses that match
            // no account are what separate a guessing attack from a typo.
            $this->activity->loginFailed($request->string('email')->toString(), $user);

            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $this->activity->loggedIn($user);

        $token = $user->createToken('spa')->plainTextToken;

        return response()
            ->json([
                'message' => 'Login berhasil.',
                'token' => $token,
                'user' => new UserResource($user),
            ])
            ->withCookie($this->cookies->make($token));
    }

    /**
     * Current user profile
     *
     * Used by the SPA to answer "am I logged in?" without reading storage, since
     * the token is stored in an `httpOnly` cookie that JavaScript cannot access.
     *
     * Remains accessible to suspended accounts so owners can see their own status.
     *
     * @response 200 array{user: array{id: int, name: string, username: string, email: string, phone: string, role: string, is_admin: bool}}
     * @response 401 array{message: string}
     */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Log out
     *
     * Revokes only the token used by this request, so logging out from one device
     * does not log the user out of other devices. The `httpOnly` cookie is also
     * removed.
     *
     * @response 200 array{message: string}
     * @response 401 array{message: string}
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /*
         * Only a stored token can be revoked. Session-based authentication yields
         * a TransientToken instead — an object with no `delete()` at all, and
         * nothing to revoke, since there is no stored row behind it.
         */
        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        $this->activity->loggedOut($user);

        return response()
            ->json(['message' => 'Logout berhasil.'])
            ->withCookie($this->cookies->forget());
    }
}
