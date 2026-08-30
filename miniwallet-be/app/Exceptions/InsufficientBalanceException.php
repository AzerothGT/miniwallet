<?php

namespace App\Exceptions;

class InsufficientBalanceException extends BusinessRuleException
{
    protected string $errorCode = 'insufficient_balance';

    public function __construct(
        private readonly int $balance,
        private readonly int $requested,
    ) {
        parent::__construct('Saldo tidak cukup untuk melakukan transaksi ini.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function details(): array
    {
        return [
            'balance' => $this->balance,
            'requested' => $this->requested,
            'shortfall' => $this->requested - $this->balance,
        ];
    }
}
