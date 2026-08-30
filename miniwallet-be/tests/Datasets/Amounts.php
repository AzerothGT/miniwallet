<?php

/*
 * Amounts the API must reject, paired with the exact message the user should
 * see. Shared by the top-up and transfer suites so both endpoints are held to
 * the same contract.
 */
dataset('invalid amounts', [
    'letters' => ['abc', 'Nominal harus berupa angka.'],
    'empty string' => ['', 'Nominal tidak boleh kosong.'],
    'null' => [null, 'Nominal tidak boleh kosong.'],
    'symbols' => ['50.000!', 'Nominal harus berupa angka.'],
    'decimal' => [1500.75, 'Nominal harus berupa angka.'],
    'thousand separators' => ['1.000', 'Nominal harus berupa angka.'],
    'negative' => [-50_000, 'Nominal minimal Rp 1.000.'],
    'zero' => [0, 'Nominal minimal Rp 1.000.'],
    'above maximum' => [999_999_999, 'Nominal melebihi batas maksimum transaksi.'],
]);
