# Mini Wallet API

REST API untuk Mini Wallet: autentikasi Sanctum, top up, transfer antar user, dan riwayat mutasi.

Frontend SPA-nya ada di repo terpisah: `miniwallet-fe`.

## Tech Stack

| Bagian | Pilihan |
| --- | --- |
| Framework | Laravel 13 (PHP 8.3+) |
| Autentikasi | Laravel Sanctum (personal access token) |
| Database | MySQL 8 |
| API Docs | Scramble (OpenAPI 3.1 + Stoplight Elements) |
| Testing | Pest 5 |
| Static analysis | Larastan (PHPStan level 7) |
| Code style | Laravel Pint |

## ERD

```mermaid
erDiagram
    USERS ||--|| WALLETS : "punya"
    USERS ||--o{ TRANSACTIONS : "pemilik"
    USERS ||--o{ TRANSACTIONS : "pihak lawan"

    USERS {
        bigint id PK
        string name
        string username UK
        string email UK
        string phone UK
        string password
        timestamp email_verified_at
    }
    WALLETS {
        bigint id PK
        bigint user_id FK,UK
        bigint balance
    }
    TRANSACTIONS {
        bigint id PK
        uuid reference
        bigint user_id FK
        bigint counterpart_id FK
        enum type
        bigint amount
        bigint balance_after
        string description
    }
```

### Kenapa satu baris per sisi mutasi

Tabel `transactions` menyimpan **satu baris untuk setiap sisi** perpindahan uang:

- Top up menghasilkan 1 baris `topup`.
- Transfer menghasilkan 2 baris dengan `reference` UUID yang sama: `transfer_out` untuk pengirim dan `transfer_in` untuk penerima.

Konsekuensinya, `GET /api/transactions` cukup memfilter `user_id = auth()->id()`. Isolasi antar user jadi sifat bawaan skema, bukan filter yang bisa lupa ditulis. Kolom `balance_after` menyimpan saldo setelah setiap mutasi sebagai jejak audit.

Saldo disimpan sebagai `bigint` rupiah bulat (tanpa sen) agar aritmetikanya eksak dan sejalan dengan aturan "nominal hanya boleh bilangan bulat". Tidak ada `float` di jalur uang.

## Cara Run

Prasyarat: PHP 8.3+, Composer, MySQL 8.

```bash
# 1. Dependency
composer install

# 2. Environment
cp .env.example .env
php artisan key:generate

# 3. Database
mysql -u root -e "CREATE DATABASE miniwallet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -e "CREATE DATABASE miniwallet_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Sesuaikan `DB_USERNAME` dan `DB_PASSWORD` di `.env`, lalu:

```bash
php artisan migrate --seed
php artisan serve
```

API jalan di `http://localhost:8000`, dokumentasi di `http://localhost:8000/docs/api`.

### Akun demo

`php artisan migrate --seed` membuat tiga akun pengguna dan satu super
administrator, semuanya dengan password `password123`:

| Nama | Email | Peran | Saldo |
| --- | --- | --- | --- |
| Ian Pratama | ian@example.com | Pengguna | Rp 435.000 |
| Budi Santoso | budi@example.com | Pengguna | Rp 300.000 |
| Citra Dewi | citra@example.com | Pengguna | Rp 115.000 |
| Super Admin | admin@example.com | Administrator | Rp 0 |

### Seeder administrator

Akun administrator dibuat oleh `AdminSeeder`, yang juga bisa dijalankan sendiri.
Ini yang dipakai saat deployment sungguhan: satu operator dibuat, tanpa wallet
demo yang tidak diinginkan di production.

```bash
php artisan db:seed --class=AdminSeeder
```

Identitasnya diambil dari environment, jadi kredensial tidak perlu di-hardcode:

| Variable | Default |
| --- | --- |
| `ADMIN_NAME` | `Super Admin` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_EMAIL` | `admin@example.com` |
| `ADMIN_PHONE` | `081200000000` |
| `ADMIN_PASSWORD` | `password123` |

Tiga sifat seeder ini yang perlu diketahui:

**Idempoten.** Menjalankannya dua kali tidak menabrak unique index pada `email`
dan tidak membuat administrator kedua. Jika akun dengan email tersebut sudah ada,
akun itu dipromosikan menjadi administrator dan diaktifkan kembali bila sedang
dinonaktifkan.

**Password akun lama tidak diubah.** Saat mempromosikan akun yang sudah ada,
password-nya dibiarkan apa adanya. Menimpanya akan membatalkan perubahan yang
sengaja dilakukan pemilik akun secara diam-diam — kegagalan yang lebih buruk
daripada meminta operator menjalankan satu perintah tambahan untuk memulihkan
akses.

**Tidak memakai factory.** `fakerphp/faker` adalah dependency `require-dev`,
sehingga `User::factory()` tidak tersedia setelah `composer install --no-dev`.
Seeder ini membangun model secara langsung agar tetap berfungsi di production.

Seeder akan memperingatkan bila `ADMIN_PASSWORD` masih memakai nilai default.

## Endpoint

| Method | Path | Auth | Keterangan |
| --- | --- | --- | --- |
| POST | `/api/register` | – | Daftar akun, otomatis membuat wallet |
| POST | `/api/login` | – | Login, mengembalikan token |
| GET | `/api/me` | ✓ | Profil user yang sedang login |
| POST | `/api/logout` | ✓ | Cabut token yang sedang dipakai |
| GET | `/api/wallet` | ✓ | Saldo saat ini |
| POST | `/api/topup` | ✓ | Tambah saldo |
| POST | `/api/transfer` | ✓ | Kirim saldo ke user lain |
| GET | `/api/transactions` | ✓ | Riwayat mutasi (masuk & keluar) |

Endpoint `register` dan `login` dibatasi 10 request per menit per IP.

## Dokumentasi API

Scramble membaca signature controller, FormRequest, dan JsonResource untuk menghasilkan spec OpenAPI, jadi dokumentasi tidak bisa basi terhadap kode.

- UI interaktif: `/docs/api`
- Spec mentah: `/docs/api.json`
- Export ke file: `php artisan scramble:export` (menghasilkan `api.json`, tidak di-commit)

Untuk mencoba endpoint terproteksi dari UI: login lewat `POST /api/login`, salin nilai `token`, lalu tekan **Authorize**.

## Strategi Penyimpanan Token

Login mengembalikan Sanctum token di **dua** tempat:

1. **Response body** — untuk API client dan tombol "Try it" di halaman docs.
2. **Cookie `httpOnly`** — untuk browser SPA.

Middleware `AuthenticateFromCookie` menyalin token dari cookie ke header `Authorization` sebelum `auth:sanctum` berjalan:

```php
if (! $request->bearerToken()) {
    $token = $request->cookie(config('auth_cookie.name'));

    if (is_string($token) && $token !== '') {
        $request->headers->set('Authorization', 'Bearer '.$token);
    }
}
```

Alasan pendekatan ini:

- **Tahan XSS.** Token tidak pernah masuk `localStorage` dan tidak bisa dibaca JavaScript, jadi script yang tersuntik tidak punya cara mengambilnya.
- **Tetap token Sanctum asli.** Requirement "menghasilkan Sanctum Token" terpenuhi; ini bukan session-based SPA mode.
- **Header selalu menang.** Kalau `Authorization` sudah ada, cookie diabaikan. Ini yang membuat Swagger tetap bisa dipakai, dan frontend bisa pindah ke bearer token tanpa mengubah backend sama sekali.

Catatan deployment: kalau API dan SPA berada di domain berbeda, cookie menjadi third-party sehingga butuh `AUTH_COOKIE_SAME_SITE=none` dan `AUTH_COOKIE_SECURE=true`. Cara yang lebih tahan lama adalah menempatkan keduanya di satu origin lewat proxy/rewrite.

## Integritas Transaksional

Transfer dijalankan di dalam satu database transaction dengan kedua baris wallet dikunci lebih dulu:

```php
$wallets = Wallet::query()
    ->whereIn('id', [$senderWalletId, $recipientWalletId])
    ->orderBy('id')          // urutan konsisten -> tidak deadlock
    ->lockForUpdate()        // baris terkunci -> tidak ada race condition
    ->get()
    ->keyBy('user_id');
```

Tiga hal yang dijaga di sini:

1. **`lockForUpdate()`** — tanpa ini, dua request paralel bisa sama-sama membaca saldo awal yang sama dan lolos dari pemeriksaan `if`, sehingga saldo bisa minus meskipun kodenya "terlihat" benar.
2. **Urutan lock berdasarkan `id`** — mencegah deadlock ketika A transfer ke B bersamaan dengan B transfer ke A.
3. **Rollback otomatis** — jika ada statement yang gagal setelah saldo pengirim terpotong, seluruh transaksi dibatalkan. Perilaku ini diuji eksplisit di `tests/Feature/TransferTest.php`.

`balance` juga sengaja tidak masuk daftar `fillable` pada model `Wallet`, jadi tidak ada controller atau mass-assignment yang bisa menggeser saldo tanpa lewat `WalletService`.

## Jejak Audit

Setiap kejadian penting dicatat ke tabel `activity_logs`: registrasi, login
(termasuk yang gagal), logout, top up, transfer, serta tindakan administrator
terhadap akun lain. Dapat dibaca lewat `GET /api/admin/logs`.

Empat keputusan yang membentuk desainnya:

**Ditulis dari dalam transaksi yang sama.** Entri untuk top up dan transfer dibuat
di dalam `DB::transaction` yang memindahkan uangnya, lewat `ActivityLogger` yang
dipanggil dari `WalletService`. Itu yang membuat jejaknya bisa dipercaya: uang
tidak bisa berpindah tanpa tercatat, dan catatan tidak bisa bertahan dari
perpindahan yang di-rollback. Keduanya diuji secara eksplisit.

**Append-only.** Tidak ada kolom `updated_at`, karena kolom itu hanya bisa
berbohong. Tidak ada endpoint tulis, dan model menolak `update` maupun `delete`
dengan melempar exception. Jejak audit hanya berguna bila tidak bisa ditulis ulang
diam-diam.

**Pokok dan pelaku dipisah.** Kolom `user_id` menyatakan akun yang menjadi pokok
kejadian, `actor_id` menyatakan siapa yang melakukannya bila berbeda — misalnya
administrator yang menonaktifkan akun orang lain. `actor_id` hanya diisi saat
memang berbeda, sehingga keberadaannya sendiri sudah berarti "seseorang bertindak
terhadap akun orang lain". Filter per user mencari di kedua kolom, agar jejak
administrator sendiri tidak tersembunyi.

**Login gagal ikut dicatat, password tidak.** Percobaan terhadap email yang tidak
terdaftar justru yang paling perlu terlihat: itu yang membedakan serangan
penebakan dari orang yang salah mengetik password sendiri. Password yang dikirim
tidak pernah disimpan dalam bentuk apa pun, dan ada test yang memeriksa seluruh
kolom untuk memastikannya.

Pencatatan dilakukan lewat pemanggilan eksplisit, bukan middleware. Middleware bisa
mencatat semua request, tetapi juga akan mencatat operasi baca — memeriksa saldo
bukan kejadian yang perlu diaudit — dan tidak punya akses ke konteks bisnis yang
membuat sebuah entri berguna: berapa nominalnya, ke siapa, dari peran apa ke apa.

## Kontrak Error

| Status | Kapan | Contoh body |
| --- | --- | --- |
| `400` | Format valid, aturan bisnis dilanggar | `{"message":"Saldo tidak cukup...","code":"insufficient_balance","shortfall":8565000}` |
| `401` | Token tidak ada / tidak valid / dicabut | `{"message":"Anda harus login...","code":"unauthenticated"}` |
| `422` | Input gagal validasi | `{"message":"Nominal harus berupa angka.","errors":{"amount":["Nominal harus berupa angka."]}}` |

Pemisahan 400 dan 422 ini disengaja: 422 berarti "bentuk request-nya salah", 400 berarti "request-nya benar tapi tidak bisa dijalankan". Frontend memanfaatkannya dengan menempelkan 422 ke field masing-masing dan menampilkan 400 sebagai banner.

### Pesan validasi nominal

| Input | Pesan |
| --- | --- |
| `""` / tidak dikirim | Nominal tidak boleh kosong. |
| `abc`, `50.000!`, `1.000`, `1500.75` | Nominal harus berupa angka. |
| `-50000`, `0` | Nominal minimal Rp 1.000. |
| `999999999` | Nominal melebihi batas maksimum transaksi. |

Rule `integer` dipakai, bukan `numeric`, supaya `1.5` ikut ditolak. Modifier `bail` memastikan hanya satu pesan yang muncul per field. Batas nominal ada di `config/wallet.php`.

Semua input tidak valid dijawab tanpa menulis apa pun ke database — hal ini diuji lewat assertion saldo dan `assertDatabaseCount('transactions', 0)`.

## Testing

```bash
composer test          # Pint + PHPStan + Pest
php artisan test       # hanya Pest
composer lint          # perbaiki style
composer types:check   # PHPStan level 7
```

103 test, 438 assertion. Test suite berjalan di MySQL (`miniwallet_test`), bukan SQLite in-memory, karena yang diuji mencakup perilaku transaksi dan row locking yang tidak dimodelkan sama oleh SQLite.

Cakupan yang penting:

- Register menolak email `user@`, password < 8 karakter, dan username duplikat.
- Login gagal memberi pesan sama untuk email tidak dikenal dan password salah, agar akun tidak bisa dienumerasi.
- Token dari cookie `httpOnly` bisa mengautentikasi request tanpa header `Authorization`.
- Logout mencabut token, dan token yang dicabut langsung tidak berlaku.
- Sembilan variasi nominal tidak valid pada top up dan transfer, masing-masing memverifikasi saldo tidak berubah dan tidak ada baris transaksi tercipta.
- Alamat penerima dibuka pada transfer keluar (untuk fitur "kirim lagi"), tetapi ditahan pada transfer masuk.
- Saldo tidak cukup, transfer ke diri sendiri, dan penerima tidak ditemukan menghasilkan 400 dengan `code` yang spesifik.
- Kegagalan di tengah transfer mengembalikan saldo pengirim (uji rollback).
- User A tidak melihat mutasi User B.
- Registrasi tidak dapat memberikan peran `admin` walaupun field `role` dikirim.
- Akun yang dinonaktifkan ditolak pada semua endpoint uang, tetapi tetap bisa membuka `/me` dan `/logout`.
- Administrator tidak dapat menonaktifkan atau menurunkan peran akunnya sendiri.
- `AdminSeeder` idempoten: dijalankan dua kali tetap menghasilkan satu administrator, dan password akun yang dipromosikan tidak berubah.
- Jejak audit ditulis di dalam transaksi yang sama dengan perpindahan uang: transfer yang di-rollback tidak meninggalkan catatan bahwa ia pernah terjadi.
- Baris activity log tidak dapat diubah maupun dihapus, dan password yang dikirim saat login gagal tidak muncul di kolom mana pun.

## Struktur

```
app/
  Enums/
    ActivityCategory.php             # auth | wallet | admin
    ActivityEvent.php                # 9 jenis kejadian yang dicatat
    TransactionType.php              # topup | transfer_in | transfer_out
    UserRole.php                     # user | admin
  Exceptions/                        # BusinessRuleException + turunannya
  Http/
    Controllers/Api/                 # Auth, Wallet, Transaction
    Controllers/Api/Admin/           # Stats, User, Transaction, ActivityLog
    Middleware/
      AuthenticateFromCookie.php     # cookie httpOnly -> header Authorization
      EnsureUserIsAdmin.php          # 403 untuk non-admin
      EnsureUserIsNotSuspended.php   # 403 untuk akun nonaktif
    Requests/                        # AmountRequest sebagai basis Topup & Transfer
    Resources/                       # bentuk response JSON, terpisah admin & user
  Models/                            # User, Wallet, Transaction, ActivityLog
  Services/
    WalletService.php                # satu-satunya tempat uang berpindah
    ActivityLogger.php               # satu-satunya tempat jejak audit ditulis
    AuthCookieFactory.php
config/
  admin.php                          # identitas bootstrap administrator
  auth_cookie.php                    # konfigurasi cookie httpOnly
  wallet.php                         # batas nominal
database/seeders/
  DatabaseSeeder.php                 # akun demo + memanggil AdminSeeder
  AdminSeeder.php                    # administrator, idempoten, tanpa faker
```

Logika uang sengaja dikumpulkan di `WalletService` supaya aturannya berlaku sama dari mana pun dipanggil (controller, command, seeder) dan bisa diuji tanpa HTTP.
