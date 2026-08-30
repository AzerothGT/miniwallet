<?php

namespace App\Http\Requests;

use App\Models\User;

class TransferRequest extends AmountRequest
{
    protected function limitKey(): string
    {
        return 'transfer';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'recipient' => ['bail', 'required', 'string', 'max:255'],
            ...$this->amountRules(),
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            ...$this->amountMessages(),
            'recipient.required' => 'Email atau nomor HP penerima tidak boleh kosong.',
        ];
    }

    /**
     * Resolve the recipient by email or phone number.
     *
     * Returns null rather than throwing so the controller can decide the status
     * code; a missing recipient is a business rule failure (400), not a
     * malformed request (422).
     */
    public function recipient(): ?User
    {
        /** @var string $identifier */
        $identifier = $this->validated('recipient');
        $identifier = trim($identifier);

        return User::query()
            ->where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();
    }

    public function amount(): int
    {
        return (int) $this->validated('amount');
    }

    public function description(): ?string
    {
        /** @var string|null $description */
        $description = $this->validated('description');

        return $description;
    }
}
