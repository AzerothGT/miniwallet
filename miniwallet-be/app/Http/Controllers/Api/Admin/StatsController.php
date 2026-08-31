<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\TransactionType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

#[Group(
    name: 'Administrasi',
    description: 'Pengawasan platform: statistik, pengelolaan akun, dan ledger seluruh transaksi. Hanya dapat diakses akun berperan `admin`, dan peran diperiksa ulang di server pada setiap request.',
    weight: 3,
)]
class StatsController extends Controller
{
    /**
     * Statistik platform
     *
     * Ringkasan seluruh platform: jumlah pengguna, total saldo, volume transaksi,
     * dan volume harian tujuh hari terakhir.
     *
     * Semua agregat dihitung langsung di database, bukan dengan memuat baris ke
     * PHP. Database dapat menjumlahkan sejuta transaksi tanpa satu pun melintasi
     * jaringan, dan angkanya tetap benar seiring tabel bertumbuh.
     *
     * Catatan penting soal `transactions.transfer`: satu transfer menulis dua
     * baris (sisi keluar dan sisi masuk), sehingga hanya sisi keluar yang
     * dihitung. Menjumlahkan keduanya akan melaporkan dua kali lipat uang yang
     * sebenarnya berpindah. Sebaliknya `transactions.total` memang menghitung
     * seluruh baris, karena itu adalah jumlah catatan pada ledger.
     *
     * Hanya dapat diakses akun berperan `admin`.
     *
     * @response 200 array{data: array{users: array{total: int, admins: int, suspended: int, new_this_week: int}, wallets: array{total_balance: int}, transactions: array{total: int, topup: array{count: int, total: int}, transfer: array{count: int, total: int}}, daily: array<int, array{day: string, total: int, count: int}>}}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     */
    public function __invoke(): JsonResponse
    {
        /*
         * The query builder is used instead of Eloquent throughout this method.
         * These results are grouped rows, not models — asking Eloquent for them
         * would produce half-populated Transaction objects whose `day` and
         * `total` are not real attributes.
         */
        $users = DB::table('users')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN role = ? THEN 1 ELSE 0 END) as admins', [UserRole::Admin->value])
            ->selectRaw('SUM(CASE WHEN suspended_at IS NOT NULL THEN 1 ELSE 0 END) as suspended')
            ->selectRaw('SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as new_this_week', [now()->subWeek()])
            ->first();

        /*
         * Cast immediately: a float would risk precision loss once the platform
         * holds enough money for it to matter.
         */
        $totalBalance = (int) DB::table('wallets')->sum('balance');

        $volume = DB::table('transactions')
            ->selectRaw('type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total')
            ->groupBy('type')
            ->get()
            ->keyBy('type');

        $volumeFor = fn (TransactionType $type): array => [
            'count' => (int) ($volume[$type->value]->count ?? 0),
            'total' => (int) ($volume[$type->value]->total ?? 0),
        ];

        // Seven days, oldest first, so a chart reads left to right.
        $daily = DB::table('transactions')
            ->selectRaw('DATE(created_at) as day, COALESCE(SUM(amount), 0) as total, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn (object $row): array => [
                'day' => (string) $row->day,
                'total' => (int) $row->total,
                'count' => (int) $row->count,
            ])
            ->all();

        return response()->json([
            'data' => [
                'users' => [
                    'total' => (int) ($users->total ?? 0),
                    'admins' => (int) ($users->admins ?? 0),
                    'suspended' => (int) ($users->suspended ?? 0),
                    'new_this_week' => (int) ($users->new_this_week ?? 0),
                ],
                'wallets' => [
                    'total_balance' => $totalBalance,
                ],
                'transactions' => [
                    'total' => DB::table('transactions')->count(),
                    'topup' => $volumeFor(TransactionType::Topup),
                    /*
                     * Only the outgoing leg is counted. A transfer writes two
                     * rows, so summing both would report twice the money that
                     * actually moved.
                     */
                    'transfer' => $volumeFor(TransactionType::TransferOut),
                ],
                'daily' => $daily,
            ],
        ]);
    }
}
