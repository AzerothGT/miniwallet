<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A user as seen by an administrator.
 *
 * Separate from UserResource because the audiences differ: this one carries
 * moderation state and balance, which no ordinary user should receive about
 * anybody. Keeping them apart means adding a field here can never accidentally
 * widen what a normal account can see.
 *
 * @mixin User
 */
class AdminUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
            'suspended' => $this->isSuspended(),
            'suspended_at' => $this->suspended_at?->toIso8601String(),
            'balance' => $this->whenLoaded(
                'wallet',
                // A user always has a wallet (created alongside the account), so
                // the relation is non-null once loaded.
                fn () => $this->wallet->balance,
            ),
            'transactions_count' => $this->whenCounted('transactions'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
