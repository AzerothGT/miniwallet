<?php

namespace App\Http\Controllers\Api;

use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\User;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group(name: 'Wallet', weight: 2)]
class TransactionController extends Controller
{
    /**
     * Transaction history
     *
     * Returns the currently authenticated user's entries, both incoming and
     * outgoing, with the newest entries first.
     *
     * The query runs through the user's own `transactions` relationship, so no
     * code path can return another user's rows, regardless of the query
     * parameters provided.
     *
     * Optional `type` filter: `topup`, `transfer_in`, or `transfer_out`.
     * Unknown values are ignored (returning all entries) instead of producing a
     * confusing empty list.
     *
     * @response 200 array{data: array<int, array<string, mixed>>, meta: array<string, mixed>}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $type = $request->string('type')->toString();

        $transactions = $user->transactions()
            ->with('counterpart')
            ->when(
                TransactionType::tryFrom($type),
                fn ($query, TransactionType $type) => $query->where('type', $type),
            )
            ->latest('created_at')
            ->latest('id')
            ->paginate(perPage: min((int) $request->integer('per_page', 15), 100));

        return TransactionResource::collection($transactions);
    }
}
