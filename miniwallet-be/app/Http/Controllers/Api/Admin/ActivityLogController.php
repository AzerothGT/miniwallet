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

#[Group(name: 'Administrasi', weight: 3)]
class ActivityLogController extends Controller
{
    /**
     * Jejak aktivitas
     *
     * Catatan seluruh kejadian di platform: registrasi, login (termasuk yang
     * gagal), logout, top up, transfer, serta tindakan administrator terhadap
     * akun lain.
     *
     * Log bersifat append-only. Tidak ada endpoint untuk mengubah maupun menghapus
     * baris, dan model menolaknya di tingkat aplikasi. Jejak audit hanya berguna
     * bila tidak bisa ditulis ulang diam-diam.
     *
     * Setiap baris memiliki dua kemungkinan pihak:
     *
     * - `user` adalah akun yang menjadi pokok kejadian
     * - `actor` adalah pihak yang melakukannya, bila berbeda, misalnya
     *   administrator yang menonaktifkan akun orang lain
     *
     * Filter yang tersedia:
     *
     * - `category`: `auth`, `wallet`, atau `admin`
     * - `event`: nilai spesifik seperti `login_failed` atau `transfer_sent`
     * - `user_id`: kejadian yang melibatkan user tertentu, sebagai pokok maupun
     *   sebagai pelaku
     * - `search`: deskripsi atau alamat IP
     * - `from` dan `to`: rentang tanggal dengan format `YYYY-MM-DD`
     *
     * Percobaan login yang gagal ikut dicatat meskipun emailnya tidak terdaftar,
     * justru karena kasus itulah yang paling perlu terlihat. Password yang dikirim
     * tidak pernah disimpan dalam bentuk apa pun.
     *
     * Hanya dapat diakses akun berperan `admin`.
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
     * Pilihan filter jejak aktivitas
     *
     * Daftar kategori dan jenis kejadian yang tersedia, agar klien tidak perlu
     * menyalin nilai enum ke dalam kodenya sendiri. Menambah satu jenis kejadian
     * di server akan otomatis muncul di sini.
     *
     * Hanya dapat diakses akun berperan `admin`.
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
