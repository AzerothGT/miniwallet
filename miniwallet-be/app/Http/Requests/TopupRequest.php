<?php

namespace App\Http\Requests;

class TopupRequest extends AmountRequest
{
    protected function limitKey(): string
    {
        return 'topup';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...$this->amountRules(),
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return $this->amountMessages();
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
