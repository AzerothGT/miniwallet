# Mini Wallet Dashboard

SPA React untuk Mini Wallet: login, cek saldo, top up, transfer, dan lihat riwayat mutasi.

Backend-nya ada di `miniwallet-be` (Laravel + Sanctum).

## Tech Stack

| Bagian | Pilihan |
| --- | --- |
| Framework | React 19 |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| HTTP client | Axios |
| Linter | oxlint |
| Styling | CSS murni (custom properties) |

Tidak ada UI library atau state manager tambahan. Untuk aplikasi sekecil ini, `useState` plus satu hook fetch sudah cukup, dan hasilnya lebih mudah dibaca daripada memasang dependency yang fiturnya 90% tidak terpakai.

## Cara Run

Prasyarat: Node.js 20+, dan backend `miniwallet-be` sudah jalan di `http://localhost:8000`.

```bash
npm install
cp .env.example .env
npm run dev
```

Aplikasi jalan di `http://localhost:5173`.

Perintah lain:

```bash
npm run build     # build produksi ke dist/
npm run preview   # preview hasil build
npm run lint      # oxlint
```

### Environment

| Variable | Default | Keterangan |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000/api` | Base URL API |

## Halaman

| Route | Akses | Isi |
| --- | --- | --- |
| `/login` | guest | Form login |
| `/register` | guest | Form pendaftaran |
| `/dashboard` | terautentikasi | Saldo, top up, transfer, tabel riwayat |

`ProtectedRoute` melempar user tanpa sesi ke `/login`; `GuestRoute` melempar user yang sudah login ke `/dashboard`.

## Penyimpanan Token

Frontend **tidak pernah menyentuh token**. Token dikirim backend sebagai cookie `httpOnly`, dan axios dikonfigurasi dengan `withCredentials: true` supaya cookie itu ikut terkirim:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})
```

Tidak ada `localStorage.setItem('token', ...)` di codebase ini. Konsekuensinya, script yang berhasil disuntik lewat XSS tidak punya cara membaca token — berbeda dengan pendekatan localStorage yang tokennya bisa diambil satu baris kode.

Karena token tidak terlihat dari sisi klien, pertanyaan "apakah saya sudah login?" dijawab dengan memanggil `GET /api/me` saat aplikasi dimuat, bukan dengan mengecek isi storage.

## Error Handling

Semua kegagalan HTTP dinormalisasi jadi satu bentuk `ApiError` di `src/lib/api.js`, sehingga komponen tidak perlu tahu struktur internal axios:

```js
export class ApiError extends Error {
  constructor({ message, status, code, fieldErrors, details }) { ... }
  fieldError(field) { return this.fieldErrors[field]?.[0] }
}
```

Penanganannya dibedakan berdasarkan status:

| Status | Tampilan di UI |
| --- | --- |
| `422` | Pesan menempel di bawah field yang bersangkutan |
| `400` | Banner di atas form, misal "Saldo tidak cukup untuk melakukan transaksi ini. Kekurangan Rp 8.565.000." |
| `0` (jaringan) | "Tidak dapat menghubungi server. Periksa koneksi internet Anda." |

Untuk `insufficient_balance`, nilai `shortfall` dari backend ikut ditampilkan supaya user langsung tahu kekurangannya berapa, bukan cuma tahu bahwa gagal.

## Mencegah Double Submit

Tiga lapis, karena satu saja tidak cukup:

1. **Tombol disabled selama request** — `SubmitButton` menerima prop `loading` dan men-set `disabled` plus `aria-busy`, sekaligus menampilkan spinner dan teks progres ("Mengirim transfer…").
2. **Guard di awal handler** — `if (submitting || !canSubmit) return` menangkap submit yang lolos lewat tombol Enter atau klik ganda yang sangat cepat.
3. **Tombol disabled sampai form valid** — validasi client-side (`src/lib/validation.js`) mencerminkan aturan backend, jadi request yang pasti gagal tidak pernah dikirim. Backend tetap jadi sumber kebenaran; ini hanya menghemat satu round trip.

Semua input juga di-disable selama request berjalan, supaya user tidak mengubah nominal di tengah proses pengiriman.

## Input Nominal

`AmountInput` sengaja memakai `type="text"` dan bukan `type="number"`:

- Input number di sebagian besar browser masih menerima `e`, `+`, `-`, dan desimal.
- Spinner naik-turunnya tidak masuk akal untuk nominal uang.

Yang dilakukan: setiap ketikan difilter jadi digit saja, ditampilkan dengan pemisah ribuan (`50.000`) agar mudah dibaca, tetapi yang dikirim ke API tetap integer mentah (`50000`).

## Struktur

```
src/
  auth/
    AuthContext.js       # context object
    AuthProvider.jsx     # state user, login/register/logout
    useAuth.js           # hook konsumen
  components/
    Alert.jsx            # banner error/sukses (role="alert")
    AmountInput.jsx      # input rupiah, filter digit
    BalanceCard.jsx
    RouteGuards.jsx      # ProtectedRoute & GuestRoute
    SubmitButton.jsx     # loading state + anti double submit
    TextField.jsx
    TopupForm.jsx
    TransactionTable.jsx
    TransferForm.jsx
  lib/
    api.js               # axios instance + ApiError
    format.js            # format rupiah, tanggal, pemisah ribuan
    useApiResource.js    # hook GET dengan loading/error dan guard race condition
    validation.js        # aturan client-side, mencerminkan backend
  pages/
    Dashboard.jsx
    Login.jsx
    Register.jsx
```

`useApiResource` memakai flag `cancelled` di cleanup effect supaya response yang datang terlambat (misalnya setelah filter diganti) tidak menimpa data yang lebih baru.

## Aksesibilitas

- Semua input punya `<label>` yang terkait lewat `htmlFor`, plus `aria-describedby` untuk hint dan pesan error.
- Field yang error diberi `aria-invalid="true"`.
- Banner error memakai `role="alert"` agar langsung diumumkan screen reader.
- Tombol yang sedang memproses memakai `aria-busy`, filter aktif memakai `aria-pressed`.
- Tabel punya `<caption>` yang di-hide secara visual dan `scope` pada setiap header.
- Focus ring konsisten lewat `:focus-visible`, dan animasi spinner diperlambat saat `prefers-reduced-motion`.
