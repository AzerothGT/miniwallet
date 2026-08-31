<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
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
            // Exposed so the SPA knows whether to offer the admin area at all.
            // The client uses it to route; the server never trusts it, because
            // every admin endpoint re-checks the role independently.
            'role' => $this->role->value,
            'is_admin' => $this->isAdmin(),
        ];
    }
}
