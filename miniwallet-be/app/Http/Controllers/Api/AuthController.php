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
    name: 'Autentikasi',
    description: 'Registrasi, login, profil, dan logout. Endpoint di bawah ini adalah pintu masuk ke seluruh API.',
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
     * Registrasi akun
     *
     * Membuat akun beserta wallet-nya dalam satu database transaction, sehingga
     * tidak mungkin ada user tanpa wallet untuk menampung uangnya.
     *
     * Sanctum token dikembalikan pada response body (untuk API client dan tombol
     * "Try it" di halaman ini) sekaligus dipasang sebagai cookie `httpOnly`
     * (untuk SPA di browser).
     *
     * Field `role` dan `suspended_at` tidak dapat diisi lewat endpoint ini. Akun
     * baru selalu berperan `user` dan berstatus aktif.
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
     * Login
     *
     * Mengembalikan Sanctum token dan memasangnya sebagai cookie `httpOnly`.
     *
     * Email yang tidak dikenal dan password yang salah menghasilkan pesan yang
     * sama persis. Membedakan keduanya akan memungkinkan penyerang menebak akun
     * mana yang terdaftar.
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
     * Profil user saat ini
     *
     * Dipakai SPA untuk menjawab "apakah saya sudah login?" tanpa membaca isi
     * storage, karena token tersimpan di cookie `httpOnly` yang tidak dapat
     * diakses JavaScript.
     *
     * Tetap dapat diakses oleh akun yang dinonaktifkan, agar pemiliknya bisa
     * mengetahui statusnya sendiri.
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
     * Logout
     *
     * Mencabut hanya token yang dipakai pada request ini, sehingga keluar dari
     * satu perangkat tidak mengeluarkan user dari perangkat lainnya. Cookie
     * `httpOnly` ikut dihapus.
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
