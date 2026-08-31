<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts a route to administrators.
 *
 * Answers 403 rather than 404: the caller is authenticated and the resource
 * exists, so "you may not" is the truthful response. Hiding the route behind a
 * 404 would only obscure it from someone who already knows it is there.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke resource ini.',
                'code' => 'forbidden',
            ], 403);
        }

        return $next($request);
    }
}
