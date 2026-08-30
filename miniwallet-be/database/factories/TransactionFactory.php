<?php

namespace Database\Factories;

use App\Enums\TransactionType;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->numberBetween(10, 500) * 1000;

        return [
            'reference' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'counterpart_id' => null,
            'type' => TransactionType::Topup,
            'amount' => $amount,
            'balance_after' => $amount,
            'description' => null,
        ];
    }
}
