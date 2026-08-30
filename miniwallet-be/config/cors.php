<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The SPA lives on a different origin during development (Vite on :5173),
    | so it needs an explicit allow-list here.
    |
    | Because the auth token travels in a cookie, `supports_credentials` must be
    | true. The spec forbids combining credentials with a wildcard origin, which
    | is why `allowed_origins` names the frontend URL explicitly instead of '*'.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'http://localhost:5173'),
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
