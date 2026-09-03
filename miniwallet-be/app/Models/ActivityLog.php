<?php

namespace App\Models;

use App\Enums\ActivityEvent;
use Database\Factories\ActivityLogFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use RuntimeException;

/**
 * @property int $id
 * @property int|null $user_id
 * @property int|null $actor_id
 * @property ActivityEvent $event
 * @property string $description
 * @property array<string, mixed>|null $properties
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property Carbon|null $created_at
 * @property-read User|null $user
 * @property-read User|null $actor
 */
#[Fillable([
    'user_id',
    'actor_id',
    'event',
    'description',
    'properties',
    'ip_address',
    'user_agent',
])]
class ActivityLog extends Model
{
    /** @use HasFactory<ActivityLogFactory> */
    use HasFactory;

    /**
     * A log row carries no `updated_at`, because it is never updated.
     */
    public const UPDATED_AT = null;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'event' => ActivityEvent::class,
            'properties' => 'array',
        ];
    }

    /**
     * Make the table append-only.
     *
     * An audit trail is only worth reading if it cannot be quietly rewritten, so
     * editing or removing an entry fails loudly rather than being permitted by
     * omission. Anything that genuinely needs to drop rows (retention policy,
     * test teardown) operates on the table directly and bypasses these hooks.
     */
    protected static function booted(): void
    {
        static::updating(function (): never {
            throw new RuntimeException('Baris activity log tidak dapat diubah.');
        });

        static::deleting(function (): never {
            throw new RuntimeException('Baris activity log tidak dapat dihapus.');
        });
    }

    /**
     * The account this entry concerns.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Who performed the action, when that is someone other than the subject.
     *
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
