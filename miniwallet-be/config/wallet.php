<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Transaction Limits
    |--------------------------------------------------------------------------
    |
    | All amounts are expressed in whole rupiah. Keeping them here (instead of
    | hardcoding them in validation rules) means the API, the error messages and
    | the OpenAPI docs all read from a single source of truth.
    |
    */

    'topup' => [
        'min' => (int) env('WALLET_MIN_TOPUP', 1_000),
        'max' => (int) env('WALLET_MAX_TOPUP', 10_000_000),
    ],

    'transfer' => [
        'min' => (int) env('WALLET_MIN_TRANSFER', 1_000),
        'max' => (int) env('WALLET_MAX_TRANSFER', 10_000_000),
    ],

];
