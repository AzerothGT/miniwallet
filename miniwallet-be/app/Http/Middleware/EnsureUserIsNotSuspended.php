<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks a suspended account from every authenticated route.
 *
 * Runs after `auth:sanctum`, so the account is known before the check. Applied
 * as a group-wide middleware rather than a check inside each controller: an
 * account that must not transact must not transact anywhere, and a per-endpoint
 * check is a rule that someone will eventually forget to copy.
 */
class EnsureUserIsNotSuspended
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isSuspended()) {
            return response()->json([
                'message' => 'Akun Anda dinonaktifkan. Hubungi administrator.',
                'code' => 'account_suspended',
                'suspended_at' => $user->suspended_at?->toIso8601String(),
            ], 403);
        }

        return $next($request);
    }
}
