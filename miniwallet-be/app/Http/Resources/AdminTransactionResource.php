<?php

namespace App\Http\Resources;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A transaction as seen by an administrator.
 *
 * Adds the row's owner, which the user-facing resource omits because there it is
 * always the caller. In the platform-wide ledger it is the first thing you need
 * to know, so a separate resource keeps the two views from drifting into one
 * shape that serves neither well.
 *
 * @mixin Transaction
 */
class AdminTransactionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'direction' => $this->type->isCredit() ? 'in' : 'out',
            'amount' => $this->amount,
            'balance_after' => $this->balance_after,
            'description' => $this->description,
            'owner' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username,
            ]),
            'counterpart' => $this->whenLoaded(
                'counterpart',
                fn () => $this->counterpart ? [
                    'id' => $this->counterpart->id,
                    'name' => $this->counterpart->name,
                    'username' => $this->counterpart->username,
                ] : null,
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
