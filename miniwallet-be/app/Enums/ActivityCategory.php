<?php

namespace App\Enums;

enum ActivityCategory: string
{
    case Auth = 'auth';
    case Wallet = 'wallet';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Auth => 'Autentikasi',
            self::Wallet => 'Wallet',
            self::Admin => 'Administrasi',
        };
    }
}
