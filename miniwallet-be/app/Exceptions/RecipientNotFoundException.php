<?php

namespace App\Exceptions;

class RecipientNotFoundException extends BusinessRuleException
{
    protected string $errorCode = 'recipient_not_found';

    public function __construct()
    {
        parent::__construct('Penerima tidak ditemukan. Periksa kembali email atau nomor HP.');
    }
}
