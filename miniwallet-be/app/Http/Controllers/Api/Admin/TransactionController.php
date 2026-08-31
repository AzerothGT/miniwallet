<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminTransactionResource;
use App\Models\Transaction;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group(name: 'Administrasi', weight: 3)]
class TransactionController extends Controller
{
    /**
     * Ledger seluruh platform
     *
     * Daftar transaksi milik semua pengguna, berbeda dengan `GET /api/transactions`
     * yang selalu dibatasi pada akun pemanggil.
     *
     * Kedua sisi sebuah transfer muncul sebagai baris terpisah, dan itu memang
     * disengaja: administrator yang menelusuri sengketa perlu melihat pemotongan
     * dan penambahan sebagai catatan yang masing-masing dapat diverifikasi.
     * Keduanya dipasangkan lewat field `reference` yang sama.
     *
     * Setiap baris menyertakan `owner`, yaitu pemilik mutasi tersebut — field yang
     * tidak ada pada endpoint versi pengguna, karena di sana pemiliknya selalu
     * pemanggil itu sendiri.
     *
     * Filter yang tersedia:
     * - `type`: `topup`, `transfer_in`, atau `transfer_out`
     * - `user_id`: mutasi yang melibatkan user tertentu, sebagai pemilik maupun
     *   sebagai pihak lawan
     * - `search`: `reference`, nama, atau username pemilik
     *
     * Hanya dapat diakses akun berperan `admin`.
     *
     * @response 200 array{data: array<int, array<string, mixed>>, meta: array<string, mixed>}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $type = TransactionType::tryFrom($request->string('type')->toString());
        $userId = $request->integer('user_id');
        $search = trim($request->string('search')->toString());

        $transactions = Transaction::query()
            ->with(['user', 'counterpart'])
            ->when($type, fn ($query, TransactionType $type) => $query->where('type', $type))
            ->when($userId > 0, fn ($query) => $query->where(function ($query) use ($userId) {
                $query->where('user_id', $userId)->orWhere('counterpart_id', $userId);
            }))
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('reference', 'like', '%'.$search.'%')
                    ->orWhereHas('user', fn ($q) => $q->where('name', 'like', '%'.$search.'%')
                        ->orWhere('username', 'like', '%'.$search.'%'));
            }))
            ->latest('created_at')
            ->latest('id')
            ->paginate(perPage: min((int) $request->integer('per_page', 20), 100))
            ->withQueryString();

        return AdminTransactionResource::collection($transactions);
    }
}
