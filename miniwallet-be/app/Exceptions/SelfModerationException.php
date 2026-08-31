<?php

namespace App\Exceptions;

class SelfModerationException extends BusinessRuleException
{
    protected int $status = 422;

    protected string $errorCode = 'self_moderation';

    public function __construct(string $message = 'Anda tidak dapat melakukan tindakan ini pada akun sendiri.')
    {
        parent::__construct($message);
    }
}
