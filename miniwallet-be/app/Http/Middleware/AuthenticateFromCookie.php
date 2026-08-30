<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bridges the httpOnly auth cookie to Sanctum's bearer-token guard.
 *
 * The token itself is still a real Sanctum personal access token. Storing it in
 * an httpOnly cookie keeps it unreachable from JavaScript, so an XSS payload
 * cannot read or exfiltrate it the way it could with localStorage.
 *
 * An explicit Authorization header always wins. That keeps tooling such as
 * Swagger "Try it out" working, and means the frontend can fall back to bearer
 * tokens (for example when the API sits on a different site and third-party
 * cookies are blocked) with no backend change.
 */
class AuthenticateFromCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->bearerToken()) {
            /** @var string|null $token */
            $token = $request->cookie((string) config('auth_cookie.name'));

            if (is_string($token) && $token !== '') {
                $request->headers->set('Authorization', 'Bearer '.$token);
            }
        }

        return $next($request);
    }
}
