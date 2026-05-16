# TODO.md — Daftar Task & Rencana Development Amanah

> Single source of truth untuk todo dan plan. Update setiap kali ada task selesai atau plan berubah.

---

## 🟢 Fase 5: Complete Loan Lifecycle ✅ (SELESAI)

Loan cycle end-to-end dari pinjam → bayar → lunas → doa → rating.

| Task | Status | Detail |
|---|---|---|
| Payment proof review UI | ✅ Done | `PaymentProofsPage` — filter tabs (Menunggu/Diterima/Ditolak), image preview, inline verify/reject. Endpoint `GET /payment-proofs?status=` |
| Installment confirmation | ✅ Done | Inline di `PinjamanDetailPage` — lender klik "Tandai Lunas" → `PATCH /installments/:id/confirm` |
| Doa Lunas | ✅ Done | `BorrowerLoanDetailPage` — form kirim pesan syukur setelah semua cicilan lunas. Endpoint `POST /borrower/completion-messages/loan/:id` |
| Reminder system | ✅ Done | Toggle UI di `PinjamanDetailPage` untuk `reminderEnabled` dan `doaLunasEnabled`. Endpoint `PATCH /loans/:id/settings` |
| Lender rating flow | ✅ Done | `RateLenderForm` di `BorrowerLoanDetailPage` — star rating + review opsional setelah loan completed |

---

## 🟡 Fase 6: Production Readiness (BERIKUTNYA)

Siap untuk deploy dan dipakai real users.

| # | Task | Detail | Prioritas |
|---|---|---|---|
| 6.1 | Contract PDF generation | ✅ Done — Generate PDF saat loan activated, download link di UI lender & borrower | 🔴 High |
| 6.2 | Email notifications setup | Konfigurasi Resend API key, template email proper (welcome, loan created, payment confirmed, payment reminder, loan completed, doa lunas) | 🔴 High |
| 6.3 | Error handling polish | ✅ Done — Retry logic (2x), offline detection, user-friendly error messages, offline banner di semua layout, enhanced ErrorBoundary | 🟡 Medium |
| 6.4 | Seed data script | ✅ Done — `npm run db:seed` di server: 5 users, 3 loans, installments, completion message, lender rating | 🟡 Medium |
| 6.5 | Docker production config | ✅ Done — Multi-stage builds, health checks, volume mounts untuk uploads, .dockerignore, .env.example, nginx-web.conf dengan security headers | 🟡 Medium |
| 6.6 | Forgot/Reset Password flow | ✅ Done — UI + server endpoints + email template sudah lengkap | 🟡 Medium |

---

## 🔵 Fase 7: Enhancement (OPTIONAL)

Nice-to-have yang bisa ditunda setelah production ready.

| # | Task | Detail | Prioritas |
|---|---|---|---|
| 7.1 | Lender dashboard analytics | ✅ Done — GET /loans/analytics endpoint, CSS-only bar charts, repayment rate, monthly trend, purpose breakdown | 🟢 Low |
| 7.2 | Borrower credit score visual | ✅ Done — GET /borrower/credit-score endpoint, tier progression bar, next tier requirements, repayment stats, tier badges | 🟢 Low |
| 7.3 | Trustee notification system | ✅ Done — Email notifikasi saat trustee accept/decline request, collateral returned (3 template email baru) | 🟢 Low |
| 7.4 | Mobile PWA | ✅ Done — manifest.json, service worker (cache-first), PWA meta tags, apple-touch-icon, install-ready | 🟢 Low |
| 7.5 | Multi-language (i18n) | ✅ Done — Dictionary-based i18n (ID/EN), language toggle in ProfilPage, localStorage persistence, 60+ translation keys | 🟢 Low |

---

## 📋 Admin Panel — Sudah Selesai

| Fitur | Status |
|---|---|
| Dashboard dengan stats + 7-day loan trend | ✅ |
| Users management (CRUD, pagination, search, date filter) | ✅ |
| Loans management (CRUD, pagination, search, date filter) | ✅ |
| Trustees management | ✅ |
| Role changes review | ✅ |
| Documents (KTP) review grid | ✅ |
| Audit logs (entity filter, pagination) | ✅ |
| CSV export (Users, Loans) | ✅ |
| Dark mode toggle | ✅ |
| Loan contract viewing (download button) | ✅ |
| User detail page (profile, rating, loan history) | ✅ |

---

## 🐛 Known Issues

| Issue | Severity | Status |
|---|---|---|
| Borrower upload proof hardcoded `/api` path | Low | ✅ Fixed — menggunakan `api.upload()` client |
| Vite dev proxy `/uploads/*` bisa conflict dengan static file serving di production | Low | ✅ Fixed — nginx.conf sudah mount uploads volume, web container serve static via nginx |

---

## 🔧 Technical Debt

| Item | Detail | Status |
|---|---|---|
| File storage lokal | Uploads disimpan di filesystem lokal (`/uploads/`). Abstraksi `lib/storage.ts` sudah dibuat, siap diganti S3 | ✅ Partial — abstraction ready |
| No rate limiting | Auth endpoints sudah ada rate limiting (10 req/15 menit) | ✅ Sudah ada |
| JWT refresh token rotation | Refresh token sudah di-rotate (delete old, insert new) di `/auth/refresh` | ✅ Sudah ada |
| `any` usage di `tiers.ts` | `as any` di `loans.ts:263` dan `check-admin.ts:27` sudah diganti proper types | ✅ Fixed |

---

## 📝 Catatan Penting

- **Jangan** buat fitur leaderboard atau tampilan publik lender
- **Jangan** tambah field bunga/denda keterlambatan
- **Jangan** gunakan `any` di TypeScript
- **Jangan** expose `JWT_SECRET` atau `RESEND_API_KEY` ke client
- **Jangan** tambah `worship` (ibadah) di `loan_purpose`
- Borrower **harus punya akun sendiri** — bukan anonymous tracking via loan_code

---

## 🔄 Cara Update

Setelah menyelesaikan task:
1. Pindahkan dari tabel ke status ✅ Done
2. Update `PROGRESS.md` dengan detail perubahan
3. Commit dengan pesan yang jelas
