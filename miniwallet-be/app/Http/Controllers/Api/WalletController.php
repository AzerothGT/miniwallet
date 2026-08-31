<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\RecipientNotFoundException;
use App\Http\Controllers\Controller;
use App\Http\Requests\TopupRequest;
use App\Http\Requests\TransferRequest;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\WalletResource;
use App\Models\User;
use App\Services\WalletService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group(
    name: 'Wallet',
    description: 'Saldo, top up, dan transfer. Semua endpoint di bawah ini bekerja pada wallet milik user yang sedang login.',
    weight: 2,
)]
class WalletController extends Controller
{
    public function __construct(private readonly WalletService $wallets) {}

    /**
     * Lihat saldo
     *
     * Mengembalikan saldo wallet milik user yang sedang login. Nilai `balance`
     * berupa bilangan bulat rupiah untuk perhitungan, sedangkan
     * `balance_formatted` sudah siap ditampilkan.
     *
     * @response 200 array{data: array{balance: int, balance_formatted: string, updated_at: string|null}}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     */
    public function show(Request $request): WalletResource
    {
        /** @var User $user */
        $user = $request->user();

        return new WalletResource($this->wallets->walletFor($user));
    }

    /**
     * Top up saldo
     *
     * Menambah saldo ke wallet milik sendiri. Nominal wajib bilangan bulat dalam
     * batas yang dikonfigurasi; nilai lain ditolak dengan status `422` dan tidak
     * ada apa pun yang tersimpan ke database.
     *
     * Prosesnya berjalan di dalam database transaction dengan baris wallet
     * terkunci, sehingga dua request bersamaan tidak dapat membaca saldo awal
     * yang sama dan menghilangkan salah satu penambahan.
     *
     * @response 201 array{message: string, transaction: array<string, mixed>, wallet: array<string, mixed>}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     * @response 422 array{message: string, errors: array<string, array<int, string>>}
     */
    public function topUp(TopupRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $transaction = $this->wallets->topUp(
            $user,
            $request->amount(),
            $request->description(),
        );

        return response()->json([
            'message' => 'Top up berhasil.',
            'transaction' => new TransactionResource($transaction),
            'wallet' => new WalletResource($this->wallets->walletFor($user->refresh())),
        ], 201);
    }

    /**
     * Transfer saldo
     *
     * Mengirim saldo ke user lain, yang diidentifikasi lewat **email atau nomor
     * HP** pada field `recipient`.
     *
     * Pemotongan dan penambahan saldo terjadi di dalam satu database transaction
     * dengan kedua baris wallet dikunci lebih dulu (`lockForUpdate`) dan diurutkan
     * berdasarkan `id`. Urutan tetap itu mencegah deadlock ketika A mengirim ke B
     * bersamaan dengan B mengirim ke A. Jika ada kegagalan setelah saldo pengirim
     * terpotong, seluruh transaksi dibatalkan — transfer sebagian tidak mungkin
     * tersimpan maupun terlihat.
     *
     * Satu transfer menghasilkan dua baris mutasi dengan `reference` yang sama:
     * `transfer_out` untuk pengirim dan `transfer_in` untuk penerima.
     *
     * Status `400` menandakan permintaan valid secara format tetapi melanggar
     * aturan bisnis. Periksa field `code` untuk membedakannya:
     * `insufficient_balance`, `recipient_not_found`, atau `self_transfer`.
     *
     * @response 201 array{message: string, transaction: array<string, mixed>, wallet: array<string, mixed>}
     * @response 400 array{message: string, code: string}
     * @response 401 array{message: string}
     * @response 403 array{message: string, code: string}
     * @response 422 array{message: string, errors: array<string, array<int, string>>}
     *
     * @throws RecipientNotFoundException
     */
    public function transfer(TransferRequest $request): JsonResponse
    {
        /** @var User $sender */
        $sender = $request->user();

        $recipient = $request->recipient();

        if (! $recipient) {
            throw new RecipientNotFoundException;
        }

        $result = $this->wallets->transfer(
            $sender,
            $recipient,
            $request->amount(),
            $request->description(),
        );

        return response()->json([
            'message' => 'Transfer berhasil.',
            'transaction' => new TransactionResource($result['out']->load('counterpart')),
            'wallet' => new WalletResource($this->wallets->walletFor($sender->refresh())),
        ], 201);
    }
}
