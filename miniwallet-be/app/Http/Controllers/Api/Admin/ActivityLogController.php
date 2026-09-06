<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ActivityCategory;
use App\Enums\ActivityEvent;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group(name: 'Administration', weight: 3)]
class ActivityLogController extends Controller
{
    /**
     * Activity log
     *
     * Records every event on the platform: registration, login (including failed
     * attempts), logout, top-ups, transfers, and administrator actions on other
     * accounts.
     *
     * Logs are append-only. There is no endpoint for updating or deleting rows,
     * and the model rejects those operations at the application level. An audit
     * trail is useful only when it cannot be silently rewritten.
     *
     * Each row has two possible parties:
     *
     * - `user` is the account affected by the event
     * - `actor` is the party who performed it, when different, such as an
     *   administrator disabling another account
     *
     * Available filters:
     *
     * - `category`: `auth`, `wallet`, or `admin`
     * - `event`: a specific value such as `login_failed` or `transfer_sent`
     * - `user_id`: events involving a specific user, as the subject or actor
     * - `search`: description or IP address
     * - `from` and `to`: date range in `YYYY-MM-DD` format
     *
     * Failed login attempts are recorded even when the email is not registered,
     * precisely because those attempts need to be visible. Submitted passwords are
     * never stored in any form.
     *
     * Accessible only to accounts with the `admin` role.
     *
     * @response 200 array{data: array<int, array<string, mixed>>, meta: array<string, mixed>}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $category = ActivityCategory::tryFrom($request->string('category')->toString());
        $event = ActivityEvent::tryFrom($request->string('event')->toString());
        $userId = $request->integer('user_id');
        $search = trim($request->string('search')->toString());

        $logs = ActivityLog::query()
            ->with(['user', 'actor'])
            ->when($event, fn ($query, ActivityEvent $event) => $query->where('event', $event))
            /*
             * A category filter expands to the event values it covers, so the
             * grouping stays defined in one place (the enum) rather than being
             * duplicated here as a list of strings.
             */
            ->when(
                $category && ! $event,
                fn ($query) => $query->whereIn('event', ActivityEvent::valuesFor($category)),
            )
            ->when($userId > 0, fn ($query) => $query->where(
                fn ($query) => $query->where('user_id', $userId)->orWhere('actor_id', $userId),
            ))
            ->when($search !== '', fn ($query) => $query->where(
                fn ($query) => $query->where('description', 'like', '%'.$search.'%')
                    ->orWhere('ip_address', 'like', '%'.$search.'%'),
            ))
            ->when(
                $request->date('from'),
                fn ($query, $from) => $query->where('created_at', '>=', $from->startOfDay()),
            )
            ->when(
                $request->date('to'),
                fn ($query, $to) => $query->where('created_at', '<=', $to->endOfDay()),
            )
            ->latest('created_at')
            ->latest('id')
            ->paginate(perPage: min((int) $request->integer('per_page', 25), 100))
            ->withQueryString();

        return ActivityLogResource::collection($logs);
    }

    /**
     * Activity log filter options
     *
     * Lists the available categories and event types so clients do not need to
     * copy enum values into their own code. Adding an event type on the server
     * automatically makes it appear here.
     *
     * Accessible only to accounts with the `admin` role.
     *
     * @response 200 array{data: array{categories: array<int, array{value: string, label: string}>, events: array<int, array{value: string, label: string, category: string}>}}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     */
    public function filters(): JsonResponse
    {
        return response()->json([
            'data' => [
                'categories' => array_map(fn (ActivityCategory $category) => [
                    'value' => $category->value,
                    'label' => $category->label(),
                ], ActivityCategory::cases()),

                'events' => array_map(fn (ActivityEvent $event) => [
                    'value' => $event->value,
                    'label' => $event->label(),
                    'category' => $event->category()->value,
                ], ActivityEvent::cases()),
            ],
        ]);
    }
}
