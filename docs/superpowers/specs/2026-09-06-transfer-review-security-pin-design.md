# Desain: Review Transfer dan Security PIN

**Tanggal:** 2026-09-06  
**Status:** Disetujui untuk implementasi

## Tujuan

Menambahkan konfirmasi review sebelum transfer dan security PIN 6 digit sebagai lapisan autentikasi tambahan. Transfer tidak boleh langsung diproses ketika pengguna menekan tombol Kirim.

## Keputusan desain

- Security PIN dibuat oleh pengguna saat pertama kali mencoba mengirim uang.
- Jika PIN belum tersedia, halaman transfer langsung membuka modal setup PIN; pengguna tidak diarahkan ke halaman lain.
- PIN terdiri dari tepat 6 digit.
- PIN disimpan di backend sebagai hash Laravel dan tidak pernah dikembalikan ke frontend.
- Verifikasi dilakukan backend saat endpoint transfer dipanggil.
- Frontend menggunakan satu rangkaian modal: setup PIN bila perlu, review transfer, lalu input PIN untuk konfirmasi.
- Pendekatan challenge/session tidak digunakan pada tahap ini; endpoint transfer tetap menjadi batas transaksi dan otorisasi.

## Arsitektur backend

### Data

Tambahkan field nullable `security_pin` pada tabel `users`. Field ini menyimpan hash PIN, bukan PIN plaintext.

### Endpoint

- `POST /api/security-pin`
  - Authenticated.
  - Input: `pin`, `pin_confirmation` atau bentuk validasi ekuivalen.
  - Validasi: keduanya wajib tepat 6 digit dan harus sama.
  - Hanya membuat PIN pertama kali; tidak mengganti PIN yang sudah ada pada scope fitur ini.
  - Response tidak boleh mengekspos hash.

- `POST /api/transfer`
  - Tambahkan input `security_pin`.
  - Tolak request jika pengguna belum memiliki PIN.
  - Tolak request jika PIN tidak cocok dengan hash.
  - Verifikasi PIN sebelum mutasi saldo.
  - Transfer yang lolos tetap diproses oleh transaksi database atomik yang sudah ada.

### Error

Gunakan kode error yang eksplisit untuk membedakan:

- PIN belum dibuat.
- PIN salah.
- PIN setup tidak valid atau tidak cocok.

Error bisnis transfer yang sudah ada seperti saldo tidak cukup, penerima tidak ditemukan, dan transfer ke diri sendiri tetap dipertahankan.

## Arsitektur frontend

Pada halaman transfer:

1. Tombol Kirim membuka proses konfirmasi, bukan request transfer langsung.
2. Jika user belum memiliki PIN, buka modal **Buat Security PIN**.
3. Modal setup memiliki input PIN 6 digit, input konfirmasi, validasi angka/panjang/kecocokan, dan tombol Simpan PIN.
4. Setelah setup sukses, tampilkan **Review Transfer**.
5. Review menampilkan penerima, nominal Rupiah, saldo setelah transfer, serta aksi Kembali dan Konfirmasi & Kirim.
6. Setelah konfirmasi review, tampilkan input PIN 6 digit dan kirim request transfer hanya setelah PIN lengkap.
7. Selama request berjalan, kontrol input dan submit dinonaktifkan agar tidak ada duplicate transfer.
8. PIN salah mempertahankan modal dan menampilkan error inline.
9. Error jaringan atau error bisnis transfer mempertahankan konteks review dan pesan yang sudah digunakan aplikasi.
10. Setelah sukses, reset form transfer, tutup modal, dan refresh wallet/riwayat sesuai pola yang sudah ada.

PIN tidak disimpan di localStorage, sessionStorage, URL, atau state lebih lama dari kebutuhan alur konfirmasi.

## Testing

### Backend

- Migration membuat field nullable.
- PIN disimpan sebagai hash yang dapat diverifikasi, bukan plaintext.
- Setup menolak PIN non-numerik, panjang selain 6, dan konfirmasi berbeda.
- Setup tidak menimpa PIN yang sudah ada.
- Transfer dengan PIN salah ditolak dan saldo tidak berubah.
- Transfer dengan PIN benar berhasil.
- Transfer tanpa PIN ditolak secara eksplisit.

### Frontend

- Submit transfer membuka review dan tidak langsung memanggil API.
- User tanpa PIN melihat modal setup terlebih dahulu.
- Setup hanya berhasil saat PIN valid dan cocok.
- Review menampilkan penerima, nominal, dan saldo setelah transfer.
- PIN salah mempertahankan modal.
- Request transfer hanya dikirim setelah PIN lengkap.
- Loading mencegah submit ganda.
- Sukses menutup modal dan menyegarkan data transfer.

## Batasan scope

- Belum ada fitur ubah PIN, lupa PIN, atau rate limiting khusus PIN.
- Belum ada challenge/session terpisah.
- Tidak menambahkan UI library baru; gunakan komponen dan styling yang sudah ada di frontend React/Tailwind.
- Perubahan root yang sudah ada (`package.json` dan `package-lock.json` berstatus terhapus) tidak disentuh.
