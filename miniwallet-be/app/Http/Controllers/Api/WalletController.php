<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\RecipientNotFoundException;
use App\Http\Controllers\Controller;
use App\Http\Requests\TopupRequest;
use App\Http\Requests\TransferRequest;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\WalletResource;
use App\Models\User;
use App\Services\WalletService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group(
    name: 'Wallet',
    description: 'Balance, top-ups, and transfers. All endpoints below operate on the currently authenticated user\'s wallet.',
    weight: 2,
)]
class WalletController extends Controller
{
    public function __construct(private readonly WalletService $wallets) {}

    /**
     * View balance
     *
     * Returns the wallet balance of the currently authenticated user. The
     * `balance` value is a whole-number Rupiah amount for calculations, while
     * `balance_formatted` is ready for display.
     *
     * @response 200 array{data: array{balance: int, balance_formatted: string, updated_at: string|null}}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     */
    public function show(Request $request): WalletResource
    {
        /** @var User $user */
        $user = $request->user();

        return new WalletResource($this->wallets->walletFor($user));
    }

    /**
     * Top up balance
     *
     * Adds funds to the user's own wallet. The amount must be a whole number
     * within the configured limits; other values are rejected with status `422`
     * and nothing is persisted to the database.
     *
     * The process runs inside a database transaction with the wallet row locked,
     * so concurrent requests cannot read the same starting balance and lose one
     * of the additions.
     *
     * @response 201 array{message: string, transaction: array<string, mixed>, wallet: array<string, mixed>}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     * @response 422 array{message: string, errors: array<string, array<int, string>>}
     */
    public function topUp(TopupRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $transaction = $this->wallets->topUp(
            $user,
            $request->amount(),
            $request->description(),
        );

        return response()->json([
            'message' => 'Top up berhasil.',
            'transaction' => new TransactionResource($transaction),
            'wallet' => new WalletResource($this->wallets->walletFor($user->refresh())),
        ], 201);
    }

    /**
     * Transfer balance
     *
     * Sends funds to another user identified by **email or phone number** in the
     * `recipient` field.
     *
     * The debit and credit occur within one database transaction. Both wallet
     * rows are locked first with `lockForUpdate` and ordered by `id`. This fixed
     * order prevents deadlocks when A sends to B while B sends to A. If a failure
     * occurs after debiting the sender, the entire transaction is rolled back —
     * a partial transfer can never be stored or exposed.
     *
     * One transfer produces two ledger entries with the same `reference`:
     * `transfer_out` for the sender and `transfer_in` for the recipient.
     *
     * Status `400` indicates a request that is valid in format but violates a
     * business rule. Check the `code` field to distinguish:
     * `insufficient_balance`, `recipient_not_found`, or `self_transfer`.
     *
     * @response 201 array{message: string, transaction: array<string, mixed>, wallet: array<string, mixed>}
     * @response 400 array{message: string, code: string}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     * @response 422 array{message: string, errors: array<string, array<int, string>>}
     *
     * @throws RecipientNotFoundException
     */
    public function transfer(TransferRequest $request): JsonResponse
    {
        /** @var User $sender */
        $sender = $request->user();

        $recipient = $request->recipient();

        if (! $recipient) {
            throw new RecipientNotFoundException;
        }

        $result = $this->wallets->transfer(
            $sender,
            $recipient,
            $request->amount(),
            $request->description(),
        );

        return response()->json([
            'message' => 'Transfer berhasil.',
            'transaction' => new TransactionResource($result['out']->load('counterpart')),
            'wallet' => new WalletResource($this->wallets->walletFor($sender->refresh())),
        ], 201);
    }
}
