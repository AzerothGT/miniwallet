<?php

namespace App\Enums;

enum TransactionType: string
{
    case Topup = 'topup';
    case TransferIn = 'transfer_in';
    case TransferOut = 'transfer_out';

    /**
     * Whether this type increases the wallet balance.
     */
    public function isCredit(): bool
    {
        return $this !== self::TransferOut;
    }

    public function label(): string
    {
        return match ($this) {
            self::Topup => 'Top Up',
            self::TransferIn => 'Transfer Masuk',
            self::TransferOut => 'Transfer Keluar',
        };
    }
}
