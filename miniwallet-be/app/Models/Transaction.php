<?php

namespace App\Models;

use App\Enums\TransactionType;
use Database\Factories\TransactionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $reference
 * @property int $user_id
 * @property int|null $counterpart_id
 * @property TransactionType $type
 * @property int $amount
 * @property int $balance_after
 * @property string|null $description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read User|null $counterpart
 */
#[Fillable([
    'reference',
    'user_id',
    'counterpart_id',
    'type',
    'amount',
    'balance_after',
    'description',
])]
class Transaction extends Model
{
    /** @use HasFactory<TransactionFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => TransactionType::class,
            'amount' => 'integer',
            'balance_after' => 'integer',
        ];
    }

    /**
     * The wallet owner this row belongs to.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The other party of a transfer. Null for top-ups.
     *
     * @return BelongsTo<User, $this>
     */
    public function counterpart(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counterpart_id');
    }

    /**
     * Signed amount from the owner's point of view: negative when money left
     * the wallet. Useful for rendering the mutation list.
     */
    public function signedAmount(): int
    {
        return $this->type->isCredit() ? $this->amount : -$this->amount;
    }
}
