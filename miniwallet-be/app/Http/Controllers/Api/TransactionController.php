<?php

namespace App\Http\Controllers\Api;

use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\User;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group(name: 'Wallet', weight: 2)]
class TransactionController extends Controller
{
    /**
     * Riwayat mutasi
     *
     * Mengembalikan mutasi milik user yang sedang login, baik uang masuk maupun
     * keluar, terbaru lebih dulu.
     *
     * Query dijalankan melalui relasi `transactions` milik user itu sendiri,
     * sehingga tidak ada jalur kode yang dapat mengembalikan baris milik user
     * lain, apa pun query parameter yang dikirim.
     *
     * Filter opsional lewat `type`: `topup`, `transfer_in`, atau `transfer_out`.
     * Nilai yang tidak dikenal diabaikan (mengembalikan semua) alih-alih
     * menghasilkan daftar kosong yang membingungkan.
     *
     * @response 200 array{data: array<int, array<string, mixed>>, meta: array<string, mixed>}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $type = $request->string('type')->toString();

        $transactions = $user->transactions()
            ->with('counterpart')
            ->when(
                TransactionType::tryFrom($type),
                fn ($query, TransactionType $type) => $query->where('type', $type),
            )
            ->latest('created_at')
            ->latest('id')
            ->paginate(perPage: min((int) $request->integer('per_page', 15), 100));

        return TransactionResource::collection($transactions);
    }
}
