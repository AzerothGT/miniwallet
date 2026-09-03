<?php

use App\Http\Controllers\Api\Admin\ActivityLogController;
use App\Http\Controllers\Api\Admin\StatsController;
use App\Http\Controllers\Api\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsNotSuspended;
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
    // Readable and revocable even while suspended: a suspended user still needs
    // to learn why they are blocked, and to be able to sign out.
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    /*
     * Money and history require an active account. Enforced here rather than in
     * each controller: an account that must not transact must not transact
     * anywhere, and a per-endpoint check is a rule someone eventually forgets.
     */
    Route::middleware(EnsureUserIsNotSuspended::class)->group(function (): void {
        Route::get('/wallet', [WalletController::class, 'show']);
        Route::post('/topup', [WalletController::class, 'topUp']);
        Route::post('/transfer', [WalletController::class, 'transfer']);

        Route::get('/transactions', [TransactionController::class, 'index']);
    });

    /*
     * Administration. Guarded by both middlewares: a suspended administrator is
     * still suspended.
     */
    Route::middleware([EnsureUserIsNotSuspended::class, EnsureUserIsAdmin::class])
        ->prefix('admin')
        ->group(function (): void {
            Route::get('/stats', StatsController::class);

            Route::get('/users', [AdminUserController::class, 'index']);
            Route::get('/users/{user}', [AdminUserController::class, 'show']);
            Route::patch('/users/{user}/suspension', [AdminUserController::class, 'suspension']);
            Route::patch('/users/{user}/role', [AdminUserController::class, 'role']);

            Route::get('/transactions', [AdminTransactionController::class, 'index']);

            /*
             * The log has no write routes at all. It is append-only by design, and
             * the absence of an update or delete endpoint is part of that
             * guarantee rather than an oversight.
             */
            Route::get('/logs', [ActivityLogController::class, 'index']);
            Route::get('/logs/filters', [ActivityLogController::class, 'filters']);
        });
});
