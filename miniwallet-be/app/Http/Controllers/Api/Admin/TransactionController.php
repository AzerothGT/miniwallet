<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminTransactionResource;
use App\Models\Transaction;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group(name: 'Administration', weight: 3)]
class TransactionController extends Controller
{
    /**
     * Platform-wide ledger
     *
     * Lists transactions belonging to all users, unlike `GET /api/transactions`,
     * which is always restricted to the calling account.
     *
     * Both sides of a transfer appear as separate rows by design: an
     * administrator investigating a dispute needs to see the debit and credit as
     * individually verifiable records. They are paired through the same
     * `reference` field.
     *
     * Each row includes `owner`, the owner of that ledger entry — a field that is
     * absent from the user endpoint because its owner is always the caller there.
     *
     * Available filters:
     * - `type`: `topup`, `transfer_in`, or `transfer_out`
     * - `user_id`: entries involving a specific user, as owner or counterpart
     * - `search`: the owner's `reference`, name, or username
     *
     * Accessible only to accounts with the `admin` role.
     *
     * @response 200 array{data: array<int, array<string, mixed>>, meta: array<string, mixed>}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $type = TransactionType::tryFrom($request->string('type')->toString());
        $userId = $request->integer('user_id');
        $search = trim($request->string('search')->toString());

        $transactions = Transaction::query()
            ->with(['user', 'counterpart'])
            ->when($type, fn ($query, TransactionType $type) => $query->where('type', $type))
            ->when($userId > 0, fn ($query) => $query->where(function ($query) use ($userId) {
                $query->where('user_id', $userId)->orWhere('counterpart_id', $userId);
            }))
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('reference', 'like', '%'.$search.'%')
                    ->orWhereHas('user', fn ($q) => $q->where('name', 'like', '%'.$search.'%')
                        ->orWhere('username', 'like', '%'.$search.'%'));
            }))
            ->latest('created_at')
            ->latest('id')
            ->paginate(perPage: min((int) $request->integer('per_page', 20), 100))
            ->withQueryString();

        return AdminTransactionResource::collection($transactions);
    }
}
