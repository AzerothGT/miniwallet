<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Exceptions\SelfModerationException;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use App\Services\ActivityLogger;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

#[Group(name: 'Administration', weight: 3)]
class UserController extends Controller
{
    public function __construct(private readonly ActivityLogger $activity) {}

    /**
     * User list
     *
     * Supports searching by `search` (name, username, email, or phone number),
     * as well as filtering by `role` (`user` / `admin`) and `status` (`active` /
     * `suspended`).
     *
     * Each row includes the balance and transaction count, so inspecting an
     * account does not require an additional request.
     *
     * Accessible only to accounts with the `admin` role.
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
     * User details
     *
     * Accessible only to accounts with the `admin` role.
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
     * Suspend or activate an account
     *
     * Send `suspended: true` to suspend an account, or `false` to activate it
     * again.
     *
     * Suspending an account also **revokes all tokens** belonging to it. Without
     * this, already-issued tokens would continue working until they expired —
     * leaving a "suspended" account able to make transfers.
     *
     * Suspended accounts can still access `GET /api/me` and `POST /api/logout`,
     * so owners can see their status and log out. All money-related endpoints
     * return `403` with `code: account_suspended`.
     *
     * Administrators cannot suspend their own account: doing so would lock the
     * operator out with no way back in through the interface.
     *
     * Accessible only to accounts with the `admin` role.
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

        /** @var User $actor */
        $actor = $request->user();

        $this->activity->suspensionChanged($user, $actor, $suspend);

        return response()->json([
            'message' => $suspend
                ? 'Akun berhasil dinonaktifkan.'
                : 'Akun berhasil diaktifkan kembali.',
            'data' => new AdminUserResource($user->load('wallet')),
        ]);
    }

    /**
     * Change an account's role
     *
     * Accepted `role` values: `user` or `admin`.
     *
     * Administrators cannot change their own account role for the same reason as
     * suspension: demoting themselves would remove their access with no way back
     * through the interface.
     *
     * Accessible only to accounts with the `admin` role.
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

        $previous = $user->role;

        $user->role = UserRole::from($validated['role']);
        $user->save();

        /** @var User $actor */
        $actor = $request->user();

        $this->activity->roleChanged(
            $user,
            $actor,
            $previous->label(),
            $user->role->label(),
        );

        return response()->json([
            'message' => 'Peran akun berhasil diperbarui.',
            'data' => new AdminUserResource($user->load('wallet')),
        ]);
    }
}
