<?php

namespace App\Services;

use App\Enums\TransactionType;
use App\Exceptions\InsufficientBalanceException;
use App\Exceptions\SelfTransferException;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * All money movement lives here so the rules are enforced in exactly one place,
 * independent of which controller or command triggers them.
 */
class WalletService
{
    /**
     * Fetch the user's wallet, creating it if it does not exist yet.
     *
     * The relation is queried directly rather than through `$user->wallet`: a
     * lazily-loaded relation caches its result, so a null from before the wallet
     * existed would otherwise stick around and cause a second insert attempt.
     * The unique index on `wallets.user_id` is the final guard.
     */
    public function walletFor(User $user): Wallet
    {
        $wallet = $user->wallet()->first();

        if (! $wallet) {
            $wallet = $user->wallet()->forceCreate(['balance' => 0]);
        }

        $user->setRelation('wallet', $wallet);

        return $wallet;
    }

    /**
     * Add money to a wallet.
     *
     * Wrapped in a transaction with a row lock so two concurrent top-ups cannot
     * both read the same starting balance and lose one of the increments.
     */
    public function topUp(User $user, int $amount, ?string $description = null): Transaction
    {
        return DB::transaction(function () use ($user, $amount, $description): Transaction {
            $wallet = Wallet::query()
                ->whereKey($this->walletFor($user)->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $wallet->balance += $amount;
            $wallet->save();

            return Transaction::create([
                'reference' => (string) Str::uuid(),
                'user_id' => $user->getKey(),
                'counterpart_id' => null,
                'type' => TransactionType::Topup,
                'amount' => $amount,
                'balance_after' => $wallet->balance,
                'description' => $description,
            ]);
        });
    }

    /**
     * Move money between two users atomically.
     *
     * Both wallet rows are locked before anything is written, and they are
     * locked in ascending id order. Consistent ordering is what prevents a
     * deadlock when A transfers to B while B transfers to A at the same moment.
     *
     * If any statement inside the closure throws, the whole transaction rolls
     * back: the sender is never debited without the recipient being credited.
     *
     * @return array{out: Transaction, in: Transaction}
     *
     * @throws SelfTransferException
     * @throws InsufficientBalanceException
     */
    public function transfer(
        User $sender,
        User $recipient,
        int $amount,
        ?string $description = null,
    ): array {
        if ($sender->is($recipient)) {
            throw new SelfTransferException;
        }

        $senderWalletId = $this->walletFor($sender)->getKey();
        $recipientWalletId = $this->walletFor($recipient)->getKey();

        return DB::transaction(function () use (
            $sender,
            $recipient,
            $amount,
            $description,
            $senderWalletId,
            $recipientWalletId,
        ): array {
            /** @var Collection<int, Wallet> $wallets */
            $wallets = Wallet::query()
                ->whereIn('id', [$senderWalletId, $recipientWalletId])
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('user_id');

            $senderWallet = $wallets[$sender->getKey()];
            $recipientWallet = $wallets[$recipient->getKey()];

            if (! $senderWallet->hasSufficientBalance($amount)) {
                throw new InsufficientBalanceException($senderWallet->balance, $amount);
            }

            $senderWallet->balance -= $amount;
            $senderWallet->save();

            $recipientWallet->balance += $amount;
            $recipientWallet->save();

            $reference = (string) Str::uuid();

            $out = Transaction::create([
                'reference' => $reference,
                'user_id' => $sender->getKey(),
                'counterpart_id' => $recipient->getKey(),
                'type' => TransactionType::TransferOut,
                'amount' => $amount,
                'balance_after' => $senderWallet->balance,
                'description' => $description,
            ]);

            $in = Transaction::create([
                'reference' => $reference,
                'user_id' => $recipient->getKey(),
                'counterpart_id' => $sender->getKey(),
                'type' => TransactionType::TransferIn,
                'amount' => $amount,
                'balance_after' => $recipientWallet->balance,
                'description' => $description,
            ]);

            return ['out' => $out, 'in' => $in];
        });
    }
}
