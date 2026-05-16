# TODO.md — Daftar Task yang Belum Diimplementasi

> Diperbarui: 16 Mei 2026

## ✅ Selesai

### Landing Page (High Priority)
- [x] Hero section dengan CTA
- [x] Sistem — mekanisme & proses bisnis (4 roles + 5-step flow)
- [x] Tipe Pembiayaan — 8 kategori pinjaman
- [x] FAQ — 10 pertanyaan (cara kerja, bayar cicilan, keamanan, dll)
- [x] Demo App — 4 role dengan kredensial seed + copy button
- [x] Kebijakan Privasi (`/privacy`)
- [x] Syarat & Ketentuan (`/terms`)
- [x] Tentang Kami (`/about`) — tim, kontak, visi & misi
- [x] Footer dengan link navigasi

### High Priority (Sebelumnya)
- [x] Task #1: Public tracking `/track/:loanCode` — endpoint + 2 halaman
- [x] Task #4: PinjamanBaruPage → API (sudah terhubung)
- [x] Task #5: TrusteePengaturanPage routing + nav
- [x] Task #2: Doa Lunas UI (sudah ada di BorrowerLoanDetailPage)
- [x] Task #3: Contract PDF generation (sudah ada di contract.ts)
- [x] Task #6: EN translations (80+ keys)
- [x] Task #7: PWA (sw.js, manifest, meta tags)
- [x] Task #8: Email role-change approved/rejected
- [x] DocumentViewer integration (TrusteeDashboard, AdminLoanDetail, AdminUserDetail)
- [x] 404 Not Found page
- [x] Dark mode (complete)
- [x] DB indexes (40+)
- [x] Security (CORS, sanitization, MIME validation, rate limiting)

## 🔴 Belum Diimplementasi

### Medium Priority
- [ ] **Responsive polish & accessibility** — ARIA labels, keyboard navigation, font size scaling
- [ ] **Email notification expansion** — Email untuk contract generated, auto-delete notification
- [ ] **Admin dashboard expansion** — Charts untuk user growth, loan distribution map
- [ ] **Contract PDF polish** — Add loan_code to PDF, better formatting, watermark
- [ ] **i18n usage di komponen** — Ganti hardcoded text dengan `t()` function
- [ ] **Offline mode polish** — Cache API responses, show stale data when offline
- [ ] **Password strength meter** — Visual indicator saat register/change password
- [ ] **Two-factor authentication (2FA)** — TOTP-based 2FA untuk admin
- [ ] **Export data** — Export pinjaman ke CSV/PDF untuk lender
- [ ] **Bulk operations** — Bulk approve/reject applications di admin panel

### Low Priority
- [ ] **Push notifications** — Web push untuk payment reminders
- [ ] **Multi-language expansion** — Tambah bahasa Arab, Melayu
- [ ] **Analytics dashboard** — Google Analytics / Plausible integration
- [ ] **API rate limiting per IP** — Redis-based rate limiting
- [ ] **Backup & restore** — Automated database backup script
- [ ] **Audit log viewer untuk user** — User bisa lihat log aktivitas mereka
- [ ] **Loan template** — Template pinjaman yang sering digunakan
- [ ] **Recurring loans** — Pinjaman berulang otomatis
- [ ] **Group loans** — Pinjaman kelompok (multiple borrowers)
- [ ] **Mobile app** — React Native / Expo version

### Technical Debt
- [ ] **E2E tests** — Playwright/Cypress untuk critical flows
- [ ] **Integration tests** — Test API endpoints dengan test database
- [ ] **CI/CD pipeline** — GitHub Actions untuk test + deploy
- [ ] **Docker compose untuk development** — One-command setup
- [ ] **API documentation** — OpenAPI/Swagger spec
- [ ] **Error tracking** — Sentry integration
- [ ] **Performance monitoring** — Lighthouse CI, Web Vitals
- [ ] **Database migration strategy** — Production-safe migrations (drizzle-kit migrate)
- [ ] **Seed data untuk testing** — Reproducible seed untuk staging
- [ ] **Environment validation** — Zod schema untuk .env variables

## 📊 Statistik

| Kategori | Selesai | Belum | Total |
|---|---|---|---|
| High Priority | 12 | 0 | 12 |
| Medium Priority | 0 | 10 | 10 |
| Low Priority | 0 | 10 | 10 |
| Technical Debt | 0 | 10 | 10 |
| **Total** | **12** | **30** | **42** |
