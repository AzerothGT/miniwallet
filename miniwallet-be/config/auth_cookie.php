<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Auth Cookie
    |--------------------------------------------------------------------------
    |
    | The Sanctum token is delivered to the SPA in an httpOnly cookie so that
    | JavaScript (and therefore any injected script) cannot read it.
    |
    | When the API and the SPA are served from different sites, browsers treat
    | this as a third-party cookie: `same_site` must then be "none" and `secure`
    | must be true, or the cookie will be dropped. Serving both behind one
    | origin (via a proxy/rewrite) avoids that class of problem entirely.
    |
    */

    'name' => env('AUTH_COOKIE_NAME', 'access_token'),

    /*
     * Lifetime in minutes.
     */
    'lifetime' => (int) env('AUTH_COOKIE_LIFETIME', 60 * 24),

    'secure' => (bool) env('AUTH_COOKIE_SECURE', false),

    'same_site' => env('AUTH_COOKIE_SAME_SITE', 'lax'),

    'path' => '/',

    'domain' => env('AUTH_COOKIE_DOMAIN'),

];
