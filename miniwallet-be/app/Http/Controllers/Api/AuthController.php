<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthCookieFactory;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * @tags Authentication
 */
class AuthController extends Controller
{
    public function __construct(
        private readonly WalletService $wallets,
        private readonly AuthCookieFactory $cookies,
    ) {}

    /**
     * Register
     *
     * Creates the account and its wallet in a single transaction, so a user can
     * never exist without a wallet to hold their money.
     *
     * The issued Sanctum token is returned in the body (for API clients and the
     * Swagger UI) and also set as an httpOnly cookie (for the browser SPA).
     *
     * @response 201 array{message: string, token: string, user: array{id: int, name: string, username: string, email: string, phone: string}}
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
     * Login
     *
     * Returns a Sanctum token and sets it as an httpOnly cookie.
     *
     * @response 200 array{message: string, token: string, user: array{id: int, name: string, username: string, email: string, phone: string}}
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
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

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
     * Current user
     *
     * @response 200 array{user: array{id: int, name: string, username: string, email: string, phone: string}}
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
     * Logout
     *
     * Revokes only the token used for this request, so signing out on one device
     * does not sign the user out everywhere. The cookie is cleared as well.
     *
     * @response 200 array{message: string}
     * @response 401 array{message: string}
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var PersonalAccessToken|null $token */
        $token = $user->currentAccessToken();

        $token?->delete();

        return response()
            ->json(['message' => 'Logout berhasil.'])
            ->withCookie($this->cookies->forget());
    }
}
