<?php

use App\Http\Middleware\AuthenticateFromCookie;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // This is an API-only app; unauthenticated requests must render JSON,
        // never redirect to a web login route that does not exist.
        $middleware->redirectGuestsTo(fn (Request $request): ?string => null);

        // Runs before `auth:sanctum` so the httpOnly cookie can stand in for a
        // bearer header.
        $middleware->api(prepend: [
            AuthenticateFromCookie::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Without this an unauthenticated API call would try to redirect to a
        // login route that does not exist in an API-only app.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Anda harus login untuk mengakses resource ini.',
                    'code' => 'unauthenticated',
                ], 401);
            }

            return null;
        });
    })->create();
