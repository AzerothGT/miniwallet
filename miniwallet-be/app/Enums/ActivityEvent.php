<?php

namespace App\Enums;

enum ActivityEvent: string
{
    // Autentikasi
    case Registered = 'registered';
    case LoggedIn = 'logged_in';
    case LoginFailed = 'login_failed';
    case LoggedOut = 'logged_out';

    // Wallet
    case ToppedUp = 'topped_up';
    case TransferSent = 'transfer_sent';

    // Administrasi
    case UserSuspended = 'user_suspended';
    case UserReactivated = 'user_reactivated';
    case RoleChanged = 'role_changed';

    public function label(): string
    {
        return match ($this) {
            self::Registered => 'Registrasi',
            self::LoggedIn => 'Login',
            self::LoginFailed => 'Login Gagal',
            self::LoggedOut => 'Logout',
            self::ToppedUp => 'Top Up',
            self::TransferSent => 'Transfer',
            self::UserSuspended => 'Akun Dinonaktifkan',
            self::UserReactivated => 'Akun Diaktifkan',
            self::RoleChanged => 'Peran Diubah',
        };
    }

    public function category(): ActivityCategory
    {
        return match ($this) {
            self::Registered,
            self::LoggedIn,
            self::LoginFailed,
            self::LoggedOut => ActivityCategory::Auth,

            self::ToppedUp,
            self::TransferSent => ActivityCategory::Wallet,

            self::UserSuspended,
            self::UserReactivated,
            self::RoleChanged => ActivityCategory::Admin,
        };
    }

    /**
     * Whether this entry describes something that failed or was refused.
     *
     * Used by the client to mark a row without having to know the event names.
     */
    public function isAlarming(): bool
    {
        return match ($this) {
            self::LoginFailed, self::UserSuspended => true,
            default => false,
        };
    }

    /**
     * @return array<int, string>
     */
    public static function valuesFor(ActivityCategory $category): array
    {
        return array_values(array_map(
            fn (self $event) => $event->value,
            array_filter(
                self::cases(),
                fn (self $event) => $event->category() === $category,
            ),
        ));
    }
}
