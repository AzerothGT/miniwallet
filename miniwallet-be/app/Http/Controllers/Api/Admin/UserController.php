<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Exceptions\SelfModerationException;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

#[Group(name: 'Administrasi', weight: 3)]
class UserController extends Controller
{
    /**
     * Daftar pengguna
     *
     * Mendukung pencarian lewat `search` (nama, username, email, atau nomor HP),
     * serta filter `role` (`user` / `admin`) dan `status` (`active` / `suspended`).
     *
     * Setiap baris menyertakan saldo dan jumlah transaksi, sehingga pemeriksaan
     * satu akun tidak memerlukan request tambahan.
     *
     * Hanya dapat diakses akun berperan `admin`.
     *
     * @response 200 array{data: array<int, array<string, mixed>>, meta: array<string, mixed>}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $search = trim($request->string('search')->toString());
        $status = $request->string('status')->toString();
        $role = UserRole::tryFrom($request->string('role')->toString());

        $users = User::query()
            ->with('wallet')
            ->withCount('transactions')
            ->when($search !== '', function ($query) use ($search) {
                /*
                 * Grouped so the OR conditions cannot escape and disable the
                 * other filters — without the closure, `role=admin` combined
                 * with a search would return every matching user of any role.
                 */
                $query->where(function ($query) use ($search) {
                    $like = '%'.$search.'%';

                    $query->where('name', 'like', $like)
                        ->orWhere('username', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhere('phone', 'like', $like);
                });
            })
            ->when($role, fn ($query, UserRole $role) => $query->where('role', $role))
            ->when($status === 'suspended', fn ($query) => $query->whereNotNull('suspended_at'))
            ->when($status === 'active', fn ($query) => $query->whereNull('suspended_at'))
            ->latest('id')
            ->paginate(perPage: min((int) $request->integer('per_page', 15), 100))
            ->withQueryString();

        return AdminUserResource::collection($users);
    }

    /**
     * Detail satu pengguna
     *
     * Hanya dapat diakses akun berperan `admin`.
     *
     * @response 200 array{data: array<string, mixed>}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     * @response 404 array{message: string}
     */
    public function show(User $user): AdminUserResource
    {
        return new AdminUserResource(
            $user->load('wallet')->loadCount('transactions'),
        );
    }

    /**
     * Nonaktifkan atau aktifkan akun
     *
     * Kirim `suspended: true` untuk menonaktifkan, `false` untuk mengaktifkan
     * kembali.
     *
     * Menonaktifkan akun juga **mencabut seluruh token** milik akun tersebut.
     * Tanpa itu, token yang sudah terbit akan tetap berfungsi sampai kedaluwarsa
     * — akun "nonaktif" yang masih bisa melakukan transfer.
     *
     * Akun yang dinonaktifkan tetap dapat mengakses `GET /api/me` dan
     * `POST /api/logout`, agar pemiliknya bisa mengetahui statusnya dan keluar.
     * Seluruh endpoint yang berkaitan dengan uang dijawab `403` dengan
     * `code: account_suspended`.
     *
     * Administrator tidak dapat menonaktifkan akunnya sendiri: hal itu akan
     * mengunci operator keluar tanpa jalan kembali melalui antarmuka.
     *
     * Hanya dapat diakses akun berperan `admin`.
     *
     * @response 200 array{message: string, data: array<string, mixed>}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     * @response 422 array{message: string, code: string}
     *
     * @throws SelfModerationException
     */
    public function suspension(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'suspended' => ['required', 'boolean'],
        ]);

        /*
         * An administrator locking themselves out would leave the platform with
         * one fewer operator and no way back in through the UI.
         */
        if ($request->user()->is($user)) {
            throw new SelfModerationException(
                'Anda tidak dapat menonaktifkan akun sendiri.',
            );
        }

        $suspend = (bool) $validated['suspended'];

        $user->suspended_at = $suspend ? now() : null;
        $user->save();

        if ($suspend) {
            // Revoke every token, otherwise an already-issued token would keep
            // working until it expired.
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $suspend
                ? 'Akun berhasil dinonaktifkan.'
                : 'Akun berhasil diaktifkan kembali.',
            'data' => new AdminUserResource($user->load('wallet')),
        ]);
    }

    /**
     * Ubah peran akun
     *
     * Nilai `role` yang diterima: `user` atau `admin`.
     *
     * Administrator tidak dapat mengubah peran akunnya sendiri, dengan alasan
     * yang sama seperti pada penonaktifan: menurunkan diri sendiri akan
     * menghilangkan akses tanpa jalan kembali melalui antarmuka.
     *
     * Hanya dapat diakses akun berperan `admin`.
     *
     * @response 200 array{message: string, data: array<string, mixed>}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     * @response 422 array{message: string, code: string}
     *
     * @throws SelfModerationException
     */
    public function role(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        // Demoting yourself is the same trap as suspending yourself.
        if ($request->user()->is($user)) {
            throw new SelfModerationException(
                'Anda tidak dapat mengubah peran akun sendiri.',
            );
        }

        $user->role = UserRole::from($validated['role']);
        $user->save();

        return response()->json([
            'message' => 'Peran akun berhasil diperbarui.',
            'data' => new AdminUserResource($user->load('wallet')),
        ]);
    }
}
