<?php

namespace App\Models;

use Database\Factories\WalletFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $balance
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 */
#[Fillable(['user_id'])]
class Wallet extends Model
{
    /** @use HasFactory<WalletFactory> */
    use HasFactory;

    /**
     * `balance` is deliberately left out of the fillable list. It may only be
     * changed through WalletService, inside a database transaction, so no
     * controller or mass-assignment can ever move money directly.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'balance' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hasSufficientBalance(int $amount): bool
    {
        return $this->balance >= $amount;
    }
}
