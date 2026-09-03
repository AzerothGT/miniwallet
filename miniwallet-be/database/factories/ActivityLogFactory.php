<?php

namespace Database\Factories;

use App\Enums\ActivityEvent;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ActivityLog>
 */
class ActivityLogFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'actor_id' => null,
            'event' => ActivityEvent::LoggedIn,
            'description' => 'Aktivitas contoh.',
            'properties' => null,
            'ip_address' => fake()->ipv4(),
            'user_agent' => 'Mozilla/5.0 (Test)',
        ];
    }

    public function event(ActivityEvent $event): static
    {
        return $this->state(fn (array $attributes) => [
            'event' => $event,
            'description' => $event->label().' contoh.',
        ]);
    }

    /**
     * A failed sign-in, which has no associated account when the email is unknown.
     */
    public function loginFailed(?string $email = null): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => null,
            'event' => ActivityEvent::LoginFailed,
            'description' => 'Percobaan login gagal.',
            'properties' => [
                'email' => $email ?? fake()->safeEmail(),
                'akun_terdaftar' => false,
            ],
        ]);
    }

    public function at(string $timestamp): static
    {
        return $this->state(fn (array $attributes) => [
            'created_at' => $timestamp,
        ]);
    }
}
