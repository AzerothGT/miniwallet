<?php

namespace App\Http\Controllers\Api;

use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * @tags Wallet
 */
class TransactionController extends Controller
{
    /**
     * List transactions
     *
     * Returns the authenticated user's mutations, both incoming and outgoing.
     *
     * The query is scoped through the user's own `transactions` relation, so
     * there is no code path that could return another user's rows regardless of
     * the query parameters supplied.
     *
     *
     * @response 200 array{data: array<int, array<string, mixed>>, meta: array<string, mixed>}
     * @response 401 array{message: string}
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
