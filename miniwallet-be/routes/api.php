<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:10,1');

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:10,1');

/*
 * Everything below requires a valid Sanctum token, supplied either as a bearer
 * header or via the httpOnly cookie. Without it these routes answer 401.
 */
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/wallet', [WalletController::class, 'show']);
    Route::post('/topup', [WalletController::class, 'topUp']);
    Route::post('/transfer', [WalletController::class, 'transfer']);

    Route::get('/transactions', [TransactionController::class, 'index']);
});
