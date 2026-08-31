# Mini Wallet Dashboard

SPA React untuk Mini Wallet: onboarding, autentikasi, saldo, top up, transfer, laporan, dan riwayat mutasi.

Backend-nya ada di `miniwallet-be` (Laravel + Sanctum).

## Tech Stack

| Bagian | Pilihan |
| --- | --- |
| Framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 (konfigurasi CSS-first) |
| Ikon | Phosphor Icons |
| Routing | React Router 7 |
| HTTP client | Axios |
| Component workshop | Storybook 10 |
| Linter | oxlint |

Tidak ada UI library atau state manager tambahan. Untuk aplikasi sekecil ini, `useState` plus satu hook fetch sudah cukup, dan hasilnya lebih mudah dibaca daripada memasang dependency yang 90% fiturnya tidak terpakai.

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
npm run build            # build produksi ke dist/
npm run preview          # preview hasil build
npm run lint             # oxlint
npm run storybook        # Storybook di :6006
npm run build-storybook  # Storybook statis ke storybook-static/
```

### Environment

| Variable | Default | Keterangan |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000/api` | Base URL API |

## Halaman

| Route | Akses | Isi |
| --- | --- | --- |
| `/` | guest | Onboarding, hijau penuh |
| `/login` | guest | Form login |
| `/register` | guest | Form pendaftaran |
| `/dashboard` | terautentikasi | Saldo, kirim cepat, 5 transaksi terakhir |
| `/topup` | terautentikasi | Top up dengan keypad numerik |
| `/transfer` | terautentikasi | Transfer dengan keypad numerik |
| `/history` | terautentikasi | Riwayat penuh: paginasi, filter, kelompok tanggal |
| `/report` | terautentikasi | Ringkasan masuk/keluar dan grafik 7 hari |
| `/profile` | terautentikasi | Info akun, catatan keamanan, logout |

`ProtectedRoute` melempar user tanpa sesi ke `/login`; `GuestRoute` melempar user yang sudah login ke `/dashboard`.

## Layout: Mobile dan Desktop

Aplikasi punya dua komposisi, bukan satu kolom sempit yang dipusatkan di layar lebar.

Di bawah `lg` (1024px), layoutnya persis mengikuti referensi: satu kolom `26rem` dengan navigasi mengambang di bawah. Dari `lg` ke atas:

| Elemen | Mobile | Desktop |
| --- | --- | --- |
| Navigasi | Bar mengambang di bawah | Sidebar `w-64` menetap di kiri |
| Dashboard | Satu kolom bertumpuk | Dua kolom: saldo + Kirim Cepat di kiri, riwayat di kanan |
| Laporan | Bertumpuk | Dua kolom, grafik lebih tinggi (`h-56`) |
| Login/Register | Header forest + sheet form | Panel brand dan form berdampingan |
| Onboarding | Ilustrasi di atas teks | Berdampingan, ilustrasi 2× lebih besar |
| Sheet keypad | Menempel tepi bawah | Kartu biasa |
| Judul layar | Tengah | Rata kiri |

Beberapa keputusan yang perlu dicatat:

**Navigasi pindah ke sidebar, tidak diperlebar.** Di layar lebar, tepi bawah adalah titik terjauh dari mata maupun kursor. Lima destinasi yang sama pindah ke rail vertikal, di mana keduanya terbaca sebagai teks berlabel alih-alih ikon yang perlu ditafsirkan. `SideNav` dan `BottomNav` di-render eksklusif lewat `lg:hidden` / `hidden lg:block`, jadi assistive tech tidak pernah menerima dua set tautan yang sama.

**Lebar maksimum ditentukan per layar, bukan global.** `AppShell` menerima prop `maxWidth`: dashboard dan laporan memakai `max-w-5xl` karena diuntungkan dua kolom, riwayat `max-w-3xl` supaya baris tetap mudah dipindai, profil `max-w-2xl`. Top up dan transfer memakai `FocusShell` yang tetap sempit — keypad dan form pendek tidak menjadi lebih mudah dibaca saat direntangkan, dan kolom terpusat menjaga nominal, form, serta keypad dalam satu gerakan mata.

**Keypad tetap ada di desktop, tapi keyboard juga jalan.** Keypad ada karena layar sentuh tidak punya baris angka; desktop punya. Hook `useAmountKeyboard` menangani digit dan Backspace dengan aturan yang sama persis seperti keypad, jadi kedua metode input tidak bisa menyimpang. Hook itu mengabaikan event yang berasal dari `<input>`, sehingga mengetik email di kolom penerima tidak ikut menambah angka ke nominal.

**Identitas user tidak diduplikasi.** Avatar dan bell di header dashboard disembunyikan pada `lg`, karena sidebar sudah menampilkan user yang login beserta tombol keluar. Mengulang identitas di dua tempat pada satu layar memunculkan pertanyaan mana yang otoritatif.

## Kirim Cepat

Baris kontak di dashboard diturunkan dari riwayat transaksi, bukan dari endpoint kontak terpisah: orang yang benar-benar pernah Anda bayar adalah shortcut terbaik yang tersedia, dan tidak memerlukan request tambahan.

Menekan satu kontak akan **mengisi kolom email/nomor HP secara otomatis**, jadi tidak perlu mengetik ulang alamat yang sudah pernah dipakai. Formulir tetap bisa diedit, dan ada kartu identitas di atasnya yang menampilkan nama serta alamat tujuan sehingga jelas ke mana uang akan dikirim.

Dua detail yang disengaja:

- **Hanya transfer keluar yang menghasilkan kontak.** Alasannya ada di sisi backend, dan bersifat privasi, bukan teknis. Pada `transfer_out`, alamat itu dulu diketikkan sendiri oleh user, jadi mengembalikannya tidak memberi informasi baru. Pada `transfer_in`, mengembalikannya berarti menyerahkan email atau nomor HP pengirim kepada orang yang mungkin belum pernah mengetahuinya — itu bukan hak kita untuk membocorkan. Karena kontak tanpa alamat tidak bisa dipakai untuk apa pun, kontak semacam itu tidak ditampilkan sama sekali daripada ditampilkan tetapi gagal saat ditekan.
- **Mengedit alamat menghapus kartu identitas.** Kalau user mengubah kolomnya secara manual, kartu nama ikut hilang. Tanpa ini, layar bisa menampilkan "Budi Santoso" sementara uangnya sebenarnya menuju alamat lain.

Field `counterpart.transfer_target` pada API bernilai `null` untuk top up dan untuk transfer masuk, dan berisi alamat tujuan untuk transfer keluar. Perilaku ini dijaga tiga test di `tests/Feature/TransactionHistoryTest.php`, termasuk satu yang memastikan email dan nomor HP pengirim tidak muncul di field mana pun pada response transfer masuk.

## Riwayat dan Paginasi

Paginasi tinggal di **satu** tempat: `/history`. Dashboard hanya menampilkan 5 transaksi terakhir tanpa filter dan tanpa paging, lalu menautkan ke halaman riwayat. Dua daftar terpaginasi atas data yang sama hanya akan menjadi dua tempat yang harus dijaga tetap sinkron.

Halaman `/history` memuat:

- **15 baris per halaman**, dengan `meta` dari paginator Laravel.
- **Pengelompokan tanggal** dengan heading sticky: "Hari ini", "Kemarin", lalu tanggal eksplisit. Label relatif hanya dipakai untuk dua hari terakhir — lebih dari itu, "3 hari lalu" memaksa pembaca berhitung, sedangkan tanggal tidak.
- **Selisih harian**, hanya ketika satu hari punya uang masuk *dan* keluar. Kalau cuma satu arah, baris di atasnya sudah menyatakan angkanya.
- **Filter** Semua / Top Up / Masuk / Keluar, yang mereset ke halaman 1 agar tidak mendarat di halaman kosong.
- **Jumlah hasil** ("68 transaksi · halaman 2 dari 5") supaya paging punya konteks.

Komponen `Pagination` menyusun jendela halaman ringkas: halaman pertama dan terakhir selalu terjangkau, plus satu tetangga di kiri-kanan halaman aktif. Ellipsis dirender sebagai teks inert, bukan tombol, jadi tidak ada yang menyesatkan untuk diklik atau di-tab.

Catatan: tidak ada effect penjepit untuk `page`. Mengganti filter mereset ke 1, dan `Pagination` tidak pernah menawarkan halaman melebihi `last_page`, jadi `page` tidak bisa keluar jangkauan sejak awal.

## Sistem Desain

Layout dibuat untuk kolom sempit pada mobile, lalu melebar menjadi komposisi dua kolom dengan sidebar dari `lg` ke atas. Rinciannya ada di bagian "Layout: Mobile dan Desktop" di atas.

Palet: hijau forest untuk layar imersif, gradien sage untuk kartu saldo, dan satu lime terang untuk semua aksi utama. Lime dipakai hemat — satu aksen dominan terbaca sebagai desain, sedangkan palet yang tersebar rata terbaca sebagai belum selesai.

Tailwind v4 dikonfigurasi lewat CSS, bukan `tailwind.config.js`. Semua token ada di blok `@theme` pada `src/index.css`, dan setiap token otomatis menjadi utility:

```css
@theme {
  --color-forest-900: #06210f;
  --color-lime-zest: #a7e92f;
  --radius-sheet: 2rem;
}
```

Token di atas langsung menghasilkan `bg-forest-900`, `text-lime-zest`, dan `rounded-sheet`.

Hanya pola multi-properti yang benar-benar berulang dipromosikan menjadi class (`.card`, `.field-input`, `.btn-lime`, `.seg`). Layout sekali pakai tetap inline sebagai utility, karena di sanalah paling mudah dibaca — berdampingan dengan markup yang dijelaskannya.

Catatan teknis: `btn` dan `btn-pill` dideklarasikan dengan `@utility`, bukan di dalam `@layer components`, karena Tailwind v4 hanya bisa `@apply` class yang merupakan utility. Varian seperti `.btn-lime` dan `.btn-pill-lime` dibangun di atasnya.

## Storybook

56 story untuk 11 komponen. Setiap komponen presentasional didokumentasikan bersama state yang sulit dijangkau di aplikasi berjalan: loading, empty, error, dan setiap pesan validasi.

```bash
npm run storybook
```

Konfigurasinya ringkas:

- `src/index.css` di-import di `preview.jsx`, jadi story memakai Tailwind dan token yang sama persis dengan aplikasi.
- Font display dimuat lewat `preview-head.html`, karena Storybook merender di luar `index.html`.
- Satu decorator `MemoryRouter` untuk komponen yang memakai `<Link>` atau `<NavLink>`; `initialEntries` bisa di-override per story lewat `parameters.reactRouter`.
- Background tersedia dalam Canvas, Paper, dan Forest agar komponen bisa diperiksa di atas permukaan terang maupun gelap.

Manfaat konkretnya: sembilan pesan penolakan nominal bisa dilihat berdampingan tanpa harus mengetik input tidak valid satu per satu, state `loading` bisa diperiksa tanpa memperlambat jaringan, dan jendela `Pagination` bisa diuji pada 24 halaman tanpa perlu membuat 352 transaksi.

## Penyimpanan Token

Frontend **tidak pernah menyentuh token**. Token dikirim backend sebagai cookie `httpOnly`, dan axios dikonfigurasi dengan `withCredentials: true` supaya cookie itu ikut terkirim:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})
```

Tidak ada `localStorage.setItem('token', ...)` di codebase ini. Konsekuensinya, script yang berhasil disuntik lewat XSS tidak punya cara membaca token — berbeda dengan pendekatan localStorage yang tokennya bisa diambil dalam satu baris kode.

Karena token tidak terlihat dari sisi klien, pertanyaan "apakah saya sudah login?" dijawab dengan memanggil `GET /api/me` saat aplikasi dimuat, bukan dengan mengecek isi storage.

## Error Handling

Semua kegagalan HTTP dinormalisasi menjadi satu bentuk `ApiError` di `src/lib/api.js`, sehingga komponen tidak perlu tahu struktur internal axios:

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

Untuk `insufficient_balance`, nilai `shortfall` dari backend ikut ditampilkan supaya user langsung tahu kekurangannya berapa, bukan cuma tahu bahwa transaksinya gagal.

## Mencegah Double Submit

Tiga lapis, karena satu saja tidak cukup:

1. **Tombol disabled selama request** — `PillButton` menerima prop `loading` dan men-set `disabled` plus `aria-busy`. Animasi pada tombol hanya menjelaskan penantian; `disabled` adalah pengamannya.
2. **Guard di awal handler** — `if (submitting || !canSubmit) return` menangkap submit yang lolos lewat tombol Enter berbarengan dengan klik.
3. **Tombol disabled sampai form valid** — validasi client-side (`src/lib/validation.js`) mencerminkan aturan backend, jadi request yang pasti gagal tidak pernah dikirim. Backend tetap sumber kebenaran; ini hanya menghemat satu round trip.

Semua input juga di-disable selama request berjalan, supaya nominal tidak berubah di tengah proses pengiriman.

## Input Nominal

Layar top up dan transfer memakai **keypad numerik**, bukan input teks. Bedanya bukan kosmetik: dengan keypad, karakter non-digit tidak bisa dijangkau, bukan sekadar difilter. `abc` dan `50.000!` secara harfiah tidak mungkin dihasilkan. Validasi API tetap berjalan, tetapi di lapisan ini input tidak valid tidak pernah ada.

Tombol `000` disediakan karena nominal rupiah nyaris selalu ribuan — itu menghemat tiga ketukan di hampir setiap transaksi.

Di desktop, keyboard fisik juga bisa dipakai lewat `useAmountKeyboard`, dengan aturan yang sama persis seperti keypad sehingga kedua metode input tidak bisa menyimpang. Keypad tetap ditampilkan, karena membuang UI yang sudah ada hanya karena ada keyboard justru menghilangkan opsi bagi pengguna layar sentuh berukuran besar.

## Struktur

```
.storybook/
  main.js              # framework + pola story
  preview.jsx          # import Tailwind, decorator router, background
  preview-head.html    # font display untuk kanvas Storybook
src/
  auth/
    AuthContext.js     # context object
    AuthProvider.jsx   # state user, login/register/logout
    useAuth.js         # hook konsumen
  components/
    Alert.jsx          # banner error/sukses
    AppShell.jsx       # AppShell (lebar) + FocusShell (sempit)
    AuthLayout.jsx     # header forest + sheet, dua kolom di desktop
    Avatar.jsx         # inisial, warna deterministik
    BalanceCard.jsx    # hero saldo + baris aksi
    GreetingHeader.jsx
    Keypad.jsx         # entri nominal numerik
    Navigation.jsx     # SideNav (desktop) + BottomNav (mobile)
    Pagination.jsx     # jendela halaman ringkas
    PillButton.jsx     # CTA pill dengan cap panah
    QuickSend.jsx      # penerima terakhir
    RouteGuards.jsx    # ProtectedRoute & GuestRoute
    ScreenHeader.jsx
    TextField.jsx
    TransactionList.jsx  # pratinjau untuk dashboard
    TransactionRow.jsx   # satu baris mutasi
    *.stories.jsx      # 56 story
  lib/
    api.js             # axios instance + ApiError
    avatar.js          # inisial & warna deterministik
    format.js          # rupiah, tanggal, pengelompokan tanggal
    navItems.js        # lima destinasi, dipakai dua navigasi
    useAmountKeyboard.js # keyboard fisik untuk entri nominal
    useApiResource.js  # hook GET dengan loading/error dan guard race condition
    validation.js      # aturan client-side, mencerminkan backend
  pages/
    Welcome.jsx  Login.jsx  Register.jsx
    Dashboard.jsx  Topup.jsx  Transfer.jsx
    History.jsx  Report.jsx  Profile.jsx
```

`useApiResource` memakai flag `cancelled` di cleanup effect supaya response yang datang terlambat (misalnya setelah filter diganti) tidak menimpa data yang lebih baru.

Halaman `Report` menurunkan total dan grafiknya dari halaman transaksi yang sudah diambil, karena API tidak menyediakan endpoint agregat. Cakupannya disebutkan apa adanya di UI ("Ringkasan dari 50 transaksi terakhir") daripada mengarang fitur backend yang tidak pernah diminta.

## Aksesibilitas

- Semua input punya `<label>` terkait lewat `htmlFor`, plus `aria-describedby` untuk hint dan pesan error.
- Field yang error diberi `aria-invalid="true"`.
- Error memakai `role="alert"` (menginterupsi), sukses memakai `role="status"` (menunggu giliran).
- Tombol yang sedang memproses memakai `aria-busy`; filter aktif memakai `aria-pressed`.
- Item navigasi aktif ditandai bentuk pill dan label teks, bukan warna saja. Item non-aktif pada bar bawah tetap punya label via `.sr-only`; di sidebar semua label selalu terlihat.
- Hanya satu navigasi yang di-render pada satu waktu, jadi tidak ada tautan ganda untuk screen reader.
- Halaman aktif pada paginasi ditandai `aria-current="page"`; setiap tombol halaman punya `aria-label` eksplisit ("Halaman 3").
- Grafik pada halaman Report disertai tabel `.sr-only` berisi data yang sama, jadi angkanya tetap terbaca tanpa melihat batang.
- Avatar `aria-hidden` secara default karena namanya sudah dirender sebagai teks di sebelahnya; avatar yang berdiri sendiri diberi `label`.
- Focus ring konsisten lewat `:focus-visible`, dengan varian terang untuk permukaan gelap.
- Animasi dihormati `prefers-reduced-motion` melalui default Tailwind.
