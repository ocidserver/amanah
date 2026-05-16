# TODO.md — Daftar Task yang Belum Diimplementasi

> Diperbarui: 16 Mei 2026 — Fase 11: Push Notifications selesai

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

### Fase 8: Production Polish ✅
- [x] Responsive polish & accessibility — ARIA labels, keyboard navigation, focus-visible rings
- [x] i18n usage di komponen — 200+ keys, 13 komponen di-update (ID/EN)
- [x] Admin dashboard expansion — User growth chart (30 hari), loan distribution map by region
- [x] Contract PDF polish — Watermark loan_code, colored sections, highlighted totals, better formatting

### Fase 9: Offline & Bulk Operations ✅
- [x] Offline mode polish — React Query persist to localStorage, API client cache fallback, stale data display
- [x] Password strength meter — Added to change password form (ProfilPage) with visual bar + label
- [x] Export data — CSV export button on PinjamanPage (loan code, borrower, amount, purpose, status, date)
- [x] Bulk operations — Checkbox select + bulk approve/reject on AdminRoleChangesPage, export CSV

### Fase 10: Two-Factor Authentication ✅
- [x] Server-side TOTP endpoints — `/auth/2fa/setup`, `/auth/2fa/enable`, `/auth/2fa/disable`, `/auth/verify-2fa`, `/auth/2fa/status`
- [x] Client-side 2FA flow — Login intercepts admin 2FA, `AdminTwoFactorSetupPage.tsx` UI, auth store `verify2fa` action
- [x] 2FA navigation — Added to AdminLayout sidebar nav and i18n translations (ID/EN)

### Fase 11: Push Notifications ✅
- [x] Server-side web-push — `web-push` library, VAPID keys configuration, `lib/push.ts` utility
- [x] Database schema — `push_subscriptions` table (user_id, endpoint, p256dh, auth)
- [x] Push endpoints — `POST /push/subscribe`, `POST /push/unsubscribe`, `GET /push/public-key`, `POST /push/test`
- [x] Service worker — Push event handler, notification click handler, badge/icon support
- [x] Client hook — `usePushNotification()` for subscribe/unsubscribe/test, permission handling
- [x] Settings UI — Push notification toggle in PengaturanPage with test button
- [x] Cron integration — Payment reminder push notifications (H-3 and H-0) for borrower and lender
- [x] Payment proof push — Verified/rejected push notifications to borrower and lender
- [x] Loan status push — Approved, activated, cancelled, defaulted push notifications to borrower

### Fase 12: Email Verification Flow ✅
- [x] Database schema — `email_verification_tokens` table (user_id, token, expires_at, used_at)
- [x] Server endpoints — `GET /auth/verify-email?token=xxx`, `POST /auth/resend-verification`
- [x] Registration flow — Creates verification token, sends verification email instead of welcome email, returns `emailVerificationRequired` flag
- [x] Login flow — Checks `isVerified`, returns `emailVerificationRequired` if unverified, blocks login
- [x] Web page — `VerifyEmailPage.tsx` with 4 states: verifying, success, error, resend
- [x] Route — `/verify-email` added to App.tsx as public route
- [x] SignUpPage — Redirects to `/verify-email` after registration
- [x] LoginPage — Redirects to `/verify-email` when login fails due to unverified email
- [x] Email template — `[AMANAH app] Verifikasi Email` with 24-hour expiration link

## 🔴 Belum Diimplementasi

### Medium Priority
- [x] **Two-factor authentication (2FA)** — TOTP-based 2FA untuk admin
- [x] **Email notification expansion** — Email untuk contract generated, auto-delete notification

### Low Priority
- [x] **Push notifications** — Web push untuk payment reminders, payment verified/rejected, loan status changes
- [ ] **Multi-language expansion** — Tambah bahasa Arab, Melayu
- [ ] **Analytics dashboard** — Google Analytics / Plausible integration
- [ ] **API rate limiting per IP** — Redis-based rate limiting
- [ ] **Backup & restore** — Automated database backup script
- [ ] **User settings page** — Laman pengaturan via avatar menu (ganti password, setting email server, preferensi notifikasi, tema, bahasa)
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
| Medium Priority | 10 | 0 | 10 |
| Low Priority | 1 | 10 | 11 |
| Technical Debt | 0 | 10 | 10 |
| **Total** | **23** | **20** | **43** |
