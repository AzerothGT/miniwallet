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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @tags Wallet
 */
class WalletController extends Controller
{
    public function __construct(private readonly WalletService $wallets) {}

    /**
     * Get balance
     *
     * @response 200 array{data: array{balance: int, balance_formatted: string, updated_at: string|null}}
     * @response 401 array{message: string}
     */
    public function show(Request $request): WalletResource
    {
        /** @var User $user */
        $user = $request->user();

        return new WalletResource($this->wallets->walletFor($user));
    }

    /**
     * Top up
     *
     * Adds money to the authenticated user's own wallet. Amounts must be whole
     * numbers within the configured limits; anything else is rejected with 422
     * and nothing is written to the database.
     *
     * @response 201 array{message: string, transaction: array<string, mixed>, wallet: array<string, mixed>}
     * @response 401 array{message: string}
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
     * Transfer
     *
     * Sends money to another user, identified by email or phone number. The
     * debit and credit happen inside one database transaction with both wallet
     * rows locked, so a partial transfer cannot be observed or persisted.
     *
     * @response 201 array{message: string, transaction: array<string, mixed>, wallet: array<string, mixed>}
     * @response 400 array{message: string, code: string}
     * @response 401 array{message: string}
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
