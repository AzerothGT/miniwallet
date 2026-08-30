<?php

namespace App\Http\Resources;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Transaction
 */
class TransactionResource extends JsonResource
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
            'signed_amount' => $this->signedAmount(),
            'amount_formatted' => 'Rp '.number_format($this->amount, 0, ',', '.'),
            'balance_after' => $this->balance_after,
            'description' => $this->description,
            'counterpart' => $this->whenLoaded(
                'counterpart',
                fn () => $this->counterpart ? [
                    'name' => $this->counterpart->name,
                    'username' => $this->counterpart->username,
                ] : null,
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
