<?php

namespace App\Exceptions;

class SelfTransferException extends BusinessRuleException
{
    protected string $errorCode = 'self_transfer';

    public function __construct()
    {
        parent::__construct('Tidak dapat melakukan transfer ke akun sendiri.');
    }
}
