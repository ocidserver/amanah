# PRD — Product Requirements Document

## Ringkasan Produk

**Nama:** Amanah  
**Platform:** Mobile (iOS & Android via Expo)  
**Pengguna utama:** Muslim Indonesia yang ingin mencatat pinjaman kebajikan secara digital  
**Konteks:** HSI Sandbox Vibathon — tema "Baru"

---

## Pengguna & Peran

### Lender (Pemberi Pinjaman)
- Punya akun dengan email
- Bisa membuat catatan pinjaman baru
- Memilih trustee dan jenis jaminan
- Melihat progress cicilan
- Menerima doa lunas anonim dari borrower

### Borrower (Peminjam)
- **Tidak punya akun**
- Menerima `loan_code` dari lender
- Akses halaman tracking via kode tersebut
- Update status cicilan (konfirmasi pembayaran)
- Kirim doa lunas anonim saat melunasi

### Trustee (Wali Amanah)
- Punya akun dengan email
- Menerima permintaan penjagaan jaminan
- Konfirmasi penerimaan jaminan fisik
- Update status jaminan (held → returned)
- Tidak melihat detail pinjaman, hanya status jaminan

---

## Fitur MVP (Vibathon)

### F1 — Autentikasi
- [ ] Login via email OTP (6 digit, berlaku 10 menit)
- [ ] Session persisten dengan AsyncStorage
- [ ] Logout dari semua device

### F2 — Dashboard Lender
- [ ] Ringkasan: total aktif, total sudah kembali, sisa tagihan
- [ ] Daftar pinjaman aktif dengan progress bar
- [ ] Indikator status jaminan per pinjaman

### F3 — Catat Pinjaman Baru
- [ ] Input nominal, durasi, pola cicilan
- [ ] Catatan tujuan (opsional, terenkripsi)
- [ ] Pilih trustee dari daftar atau undang baru
- [ ] Pilih jenis jaminan: dokumen / barang berharga / surat pernyataan / tanpa jaminan
- [ ] Toggle privasi: sembunyikan alias borrower, aktifkan pengingat, aktifkan doa lunas
- [ ] Generate `loan_code` format `AMN-XXXX`
- [ ] Tampilkan kode + tombol salin & bagikan via WhatsApp

### F4 — Detail Pinjaman
- [ ] Header nominal + progress pelunasan
- [ ] Info wali amanah & status jaminan
- [ ] Riwayat cicilan dengan status (lunas / diproses / belum)
- [ ] Tampilkan doa lunas anonim jika ada
- [ ] Tombol akses fiqih (ke chat AI)

### F5 — Halaman Tracking Borrower (web/deeplink)
- [ ] Input `loan_code` untuk akses
- [ ] Lihat sisa pokok, jadwal cicilan
- [ ] Tombol konfirmasi pembayaran cicilan
- [ ] Form doa lunas anonim (muncul saat semua cicilan lunas)

### F6 — Manajemen Trustee
- [ ] Daftar trustee yang pernah dipilih
- [ ] Undang trustee baru via email
- [ ] Status per trustee: pending / aktif / tidak aktif

### F7 — Notifikasi
- [ ] Email pengingat cicilan jatuh tempo (H-3, H-0)
- [ ] Email konfirmasi ke trustee saat dipilih
- [ ] Email ke lender saat borrower konfirmasi cicilan

---

## Fitur Post-MVP

- Direktori trustee komunitas terverifikasi (masjid, lembaga HSI)
- Export PDF akad pinjaman
- Scan dokumen jaminan (upload foto)
- Multi-bahasa (Indonesia + Inggris)
- Mode offline untuk lihat data cached

---

## Layar & Navigasi

```
(Tab) Beranda
(Tab) Pinjaman — daftar semua
(Tab) Wali Amanah
(Tab) Profil

Stack dari Beranda:
  → /loan/new          Catat pinjaman baru
  → /loan/new/success  Kode amanah berhasil dibuat
  → /loan/[id]         Detail pinjaman

Stack dari Wali:
  → /trustee/invite    Undang trustee baru

Auth Stack:
  → /auth/login        Input email
  → /auth/otp          Input kode OTP

Web (borrower):
  → /track             Input loan_code
  → /track/[code]      Detail & konfirmasi cicilan
```

---

## Non-Functional Requirements

- Load time layar utama < 2 detik pada koneksi 3G
- Semua teks mendukung font size accessibility
- Warna memenuhi WCAG AA contrast ratio
- Tidak menyimpan data sensitif di AsyncStorage dalam plaintext
- HTTPS untuk semua komunikasi dengan Supabase
