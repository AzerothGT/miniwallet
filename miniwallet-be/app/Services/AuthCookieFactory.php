<?php

namespace App\Services;

use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;

/**
 * Builds the httpOnly cookie that carries the Sanctum token.
 *
 * Note on encryption: Laravel's EncryptCookies middleware does not run on the
 * `api` middleware group, so this value is written and read as-is. The token is
 * already a high-entropy secret, and keeping it unencrypted here means the same
 * string works whether it arrives via cookie or Authorization header.
 */
class AuthCookieFactory
{
    public function make(string $token): SymfonyCookie
    {
        return Cookie::make(
            name: $this->name(),
            value: $token,
            minutes: (int) config('auth_cookie.lifetime'),
            path: (string) config('auth_cookie.path'),
            domain: config('auth_cookie.domain'),
            secure: (bool) config('auth_cookie.secure'),
            httpOnly: true,
            raw: false,
            sameSite: (string) config('auth_cookie.same_site'),
        );
    }

    public function forget(): SymfonyCookie
    {
        return Cookie::forget(
            name: $this->name(),
            path: (string) config('auth_cookie.path'),
            domain: config('auth_cookie.domain'),
        );
    }

    public function name(): string
    {
        return (string) config('auth_cookie.name');
    }
}
