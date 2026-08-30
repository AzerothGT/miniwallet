<?php

namespace App\Http\Resources;

use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Wallet
 */
class WalletResource extends JsonResource
{
    /**
     * `balance` is the raw integer for calculations; `balance_formatted` is a
     * ready-to-render string so every client formats currency identically.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'balance' => $this->balance,
            'balance_formatted' => 'Rp '.number_format($this->balance, 0, ',', '.'),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
