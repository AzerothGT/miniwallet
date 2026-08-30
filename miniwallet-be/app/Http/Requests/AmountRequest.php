<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Shared amount validation so top-up and transfer produce identical, specific
 * error messages for the same bad input.
 */
abstract class AmountRequest extends FormRequest
{
    /**
     * Which config('wallet.*') block holds the limits for this request.
     */
    abstract protected function limitKey(): string;

    protected function minAmount(): int
    {
        return (int) config("wallet.{$this->limitKey()}.min");
    }

    protected function maxAmount(): int
    {
        return (int) config("wallet.{$this->limitKey()}.max");
    }

    /**
     * `bail` stops at the first failing rule, so a value like "abc" reports only
     * "Nominal harus berupa angka." instead of also complaining about min/max.
     *
     * `integer` (not `numeric`) is what rejects decimals such as 1.5 and
     * thousand-separated strings such as "1.000", keeping amounts whole.
     *
     * @return array<string, mixed>
     */
    protected function amountRules(): array
    {
        return [
            'amount' => [
                'bail',
                'required',
                'integer',
                "min:{$this->minAmount()}",
                "max:{$this->maxAmount()}",
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function amountMessages(): array
    {
        return [
            'amount.required' => 'Nominal tidak boleh kosong.',
            'amount.integer' => 'Nominal harus berupa angka.',
            'amount.min' => 'Nominal minimal Rp '.number_format($this->minAmount(), 0, ',', '.').'.',
            'amount.max' => 'Nominal melebihi batas maksimum transaksi.',
        ];
    }
}
