<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Super Administrator Bootstrap
    |--------------------------------------------------------------------------
    |
    | Identity used by AdminSeeder to create the first operator account:
    |
    |     php artisan db:seed --class=AdminSeeder
    |
    | The defaults are meant for local work only. Set ADMIN_EMAIL and
    | ADMIN_PASSWORD in the environment before running this anywhere else; the
    | seeder prints a warning when the default password is still in use.
    |
    */

    'name' => env('ADMIN_NAME', 'Super Admin'),

    'username' => env('ADMIN_USERNAME', 'admin'),

    'email' => env('ADMIN_EMAIL', 'admin@example.com'),

    'phone' => env('ADMIN_PHONE', '081200000000'),

    'password' => env('ADMIN_PASSWORD', 'password123'),

    /*
     * Kept separately so the seeder can tell whether the password it is about to
     * use is the built-in one, and warn accordingly. Comparing against a literal
     * inside the seeder would drift the moment this default changed.
     */
    'default_password' => 'password123',

];
