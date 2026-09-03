<?php

namespace App\Services;

use App\Enums\ActivityEvent;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Writes the audit trail.
 *
 * A single entry point for every recorded event, so the shape of a log row is
 * decided in one place rather than at nine call sites.
 *
 * Recording is deliberately explicit rather than driven by middleware. Middleware
 * could log every request, but it would also log reads — checking a balance is not
 * an event worth auditing — and it has no access to the business context that
 * makes an entry useful: how much, to whom, from which role to which.
 *
 * Failures are not swallowed. A logger that silently drops entries produces a
 * trail nobody can rely on, and for money the write happens inside the same
 * transaction as the movement itself: if the transfer rolls back, so does the
 * claim that it happened.
 */
class ActivityLogger
{
    public function __construct(private readonly Request $request) {}

    /**
     * @param  array<string, mixed>  $properties
     */
    public function log(
        ActivityEvent $event,
        string $description,
        ?User $user = null,
        ?User $actor = null,
        array $properties = [],
    ): ActivityLog {
        /** @var ActivityLog $entry */
        $entry = ActivityLog::create([
            'user_id' => $user?->getKey(),
            // Stored only when it differs from the subject, so "who did this to
            // someone else" is answerable without comparing two ids on read.
            'actor_id' => $actor && ! $actor->is($user) ? $actor->getKey() : null,
            'event' => $event,
            'description' => $description,
            'properties' => $properties === [] ? null : $properties,
            'ip_address' => $this->request->ip(),
            // Truncated to fit the column; a longer string is a client quirk, not
            // information worth widening the schema for.
            'user_agent' => mb_substr((string) $this->request->userAgent(), 0, 255) ?: null,
        ]);

        return $entry;
    }

    public function registered(User $user): void
    {
        $this->log(
            ActivityEvent::Registered,
            "Akun {$user->username} terdaftar.",
            user: $user,
        );
    }

    public function loggedIn(User $user): void
    {
        $this->log(
            ActivityEvent::LoggedIn,
            "{$user->name} berhasil login.",
            user: $user,
        );
    }

    /**
     * A failed sign-in attempt.
     *
     * `$user` is null when the email matches no account, which is exactly the case
     * worth keeping: repeated attempts against unknown addresses are what
     * distinguish a guessing attack from someone mistyping their own password.
     *
     * The submitted password is never recorded, in any form.
     */
    public function loginFailed(string $email, ?User $user = null): void
    {
        $this->log(
            ActivityEvent::LoginFailed,
            "Percobaan login gagal untuk {$email}.",
            user: $user,
            properties: ['email' => $email, 'akun_terdaftar' => $user !== null],
        );
    }

    public function loggedOut(User $user): void
    {
        $this->log(
            ActivityEvent::LoggedOut,
            "{$user->name} keluar dari akun.",
            user: $user,
        );
    }

    public function toppedUp(User $user, int $amount, int $balanceAfter): void
    {
        $this->log(
            ActivityEvent::ToppedUp,
            "{$user->name} melakukan top up ".$this->rupiah($amount).'.',
            user: $user,
            properties: [
                'nominal' => $amount,
                'saldo_akhir' => $balanceAfter,
            ],
        );
    }

    public function transferSent(
        User $sender,
        User $recipient,
        int $amount,
        string $reference,
    ): void {
        $this->log(
            ActivityEvent::TransferSent,
            "{$sender->name} mengirim ".$this->rupiah($amount)." ke {$recipient->name}.",
            user: $sender,
            properties: [
                'nominal' => $amount,
                'penerima' => $recipient->username,
                'reference' => $reference,
            ],
        );
    }

    public function suspensionChanged(User $subject, User $actor, bool $suspended): void
    {
        $this->log(
            $suspended
                ? ActivityEvent::UserSuspended
                : ActivityEvent::UserReactivated,
            $suspended
                ? "Akun {$subject->username} dinonaktifkan oleh {$actor->name}."
                : "Akun {$subject->username} diaktifkan kembali oleh {$actor->name}.",
            user: $subject,
            actor: $actor,
        );
    }

    public function roleChanged(User $subject, User $actor, string $from, string $to): void
    {
        $this->log(
            ActivityEvent::RoleChanged,
            "Peran {$subject->username} diubah dari {$from} menjadi {$to} oleh {$actor->name}.",
            user: $subject,
            actor: $actor,
            properties: ['peran_lama' => $from, 'peran_baru' => $to],
        );
    }

    private function rupiah(int $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }
}
