# PROGRESS.md — Log Progres Development

## Fase 1: Project Setup ✅

- [x] Inisialisasi monorepo (packages/web, packages/server, packages/shared)
- [x] packages/web — Vite + React + Tailwind CSS v4 + React Router
- [x] packages/server — Hono + Drizzle REST API server
- [x] packages/shared — Shared TypeScript types & constants
- [x] Docker Compose untuk PostgreSQL + API + Nginx
- [x] Drizzle ORM schema (10 tabel dengan borrower tiers, lender ratings, invitations, role changes)
- [x] Auth endpoints: register, login, refresh, logout, change password, GET /me, PATCH /me (display name + phone/idNumber/address/occupation + profileCompleted), role-change-request
- [x] JWT auth with bcrypt hashing, access + refresh tokens
- [x] Role middleware: lenderOnly, borrowerOnly, adminOnly
- [x] Lender loan CRUD: GET/POST /loans, GET /loans/:id, GET /loans/search-borrower, PATCH /loans/:id/status
- [x] Borrower routes: GET /borrower/loans, GET /borrower/loans/:id, PATCH /borrower/installments/:id/confirm, POST /borrower/completion-messages, POST /borrower/rate-lender, GET /borrower/profile
- [x] New borrower application routes: GET /borrower-app/can-apply, POST /borrower-app/loans/apply, GET /borrower-app/fees-preview, GET/POST /borrower-app/bi-check
- [x] New lender application routes: GET /lender-app/applications, GET /lender-app/applications/:id, PATCH /lender-app/applications/:id/approve, PATCH /lender-app/applications/:id/reject, POST /lender-app/applications/:id/claim, PATCH /lender-app/applications/:id/activate
- [x] Installment endpoints: GET /installments/loan/:loanId, PATCH /installments/:id/confirm
- [x] Completion messages: GET/POST /completion-messages/loan/:loanId
- [x] Trustee endpoints: GET/POST /trustees, GET /trustees/:id
- [x] Invitation endpoints: GET/POST /invitations/:token
- [x] Lender ratings: POST /lender-ratings, GET /lender-ratings/loan/:loanId
- [x] Auto loan completion — when all installments paid, status → "completed", tier updates, emails
- [x] Loan cancel/default endpoint — lender can cancel or mark as defaulted
- [x] Admin fee calculation (lib/fees.ts) — ujrah 1%, materai Rp 10K, admin Rp 25K, custody 0.5%
- [x] Email notifications wired: welcome, loan created, payment confirmed, loan completed
- [x] BI checking mock endpoint (80% approved, 10% review, 10% rejected)

## Fase 2: Web App ✅

- [x] Auth pages: Login, SignUp (with role toggle, URL param prefill for invitations)
- [x] Landing page with BMT messaging
- [x] Dashboard: lender BerandaPage (with pending application count), borrower BorrowerDashboard (with "Ajukan Pinjaman" button)
- [x] Loan list pages: PinjamanPage (lender), borrower dashboard
- [x] Loan detail pages: PinjamanDetailPage (lender), BorrowerLoanDetailPage (borrower)
- [x] New: BorrowerApplyPage — borrower loan application form with fee preview
- [x] New: LenderApplicationsPage — browse pending loan applications, approve/reject
- [x] New: ApplicationDetailPage — view application details, approve or reject
- [x] Profile pages merged with Settings: ProfilPage (lender), BorrowerProfilPage (borrower) — includes profile fields + change password + logout
- [x] Invitation flow: InvitationAcceptPage
- [x] Navigation: Lender 4 tabs (Beranda, Pinjaman, Wali, Profil), Borrower 2 tabs (Pinjaman, Profil)
- [x] Protected routes with role-based redirection
- [x] Error boundaries, loading spinners
- [x] All shared types camelCase matching Drizzle ORM output

## Fase 3: BMT Cycle Implementation (In Progress)

### Done
- [x] DB schema expanded: users (phone, idNumber, address, occupation, ktpDocumentUrl, profileCompleted)
- [x] DB schema expanded: loans (applicationNote, ujrah, stampFee, adminFee, custodyFee, totalFee, disbursedAmount, transitAccount, contractUrl, approvedBy, approvedAt) + loan_status added pending/approved/rejected
- [x] DB schema: installments (reminderSentAt), collateralStatus (+verified), new tables bi_checks & payment_proofs
- [x] Server: Expanded PATCH /auth/me to update phone/idNumber/address/occupation + auto profileCompleted check
- [x] Server: GET /auth/me returns all new profile fields
- [x] Server: lib/fees.ts — admin fee calculation (ujrah 1% min 10K, stamp 10K, admin 25K, custody 0.5% min 5K)
- [x] Server: borrower-app routes — BI check, can-apply check, loan application with fee calculation
- [x] Server: lender-app routes — browse applications, view detail, approve, reject, activate
- [x] Server: loans PATCH /:id/status — support pending→approved→active transitions
- [x] Server: loan-helpers.ts — null-safe lenderId access
- [x] Server: borrower profile endpoint includes new fields + pendingLoansCount/approvedLoansCount
- [x] Web: BorrowerApplyPage — step form with fee preview + success state
- [x] Web: LenderApplicationsPage — browse pending applications
- [x] Web: ApplicationDetailPage — approve/reject with borrower profile
- [x] Web: BorrowerDashboard — "Ajukan Pinjaman" button, pending/approved status badges, loan status labels updated
- [x] Web: BerandaPage — pending applications notification badge
- [x] Web: BorrowerProfilPage — full profile editing (phone, ID, address, occupation) + change password + logout + profileCompleted indicator
- [x] Web: ProfilPage — merged with PengaturanPage (change password + logout inline)
- [x] Merged Profil + Pengaturan into single page (removed Settings tab from both layouts)
- [x] DB schema pushed via drizzle-kit push
- [x] Both server and web builds pass clean

### In Progress
- (none)

### Blocked
- (none)

## Fase 4: Onboarding Flow ✅

- [x] Server: Registration without role — role is now optional, defaults to null
- [x] Server: POST /auth/set-role endpoint for setting role after registration
- [x] Server: JWT payload uses "pending" for null role
- [x] Server: DB schema updated — role column is now nullable
- [x] Web: SignUpPage — removed role toggle, simplified form (name, email, password)
- [x] Web: OnboardingPage — role selection (Peminjam / Pemberi Pinjaman / Wali Amanah)
- [x] Web: BorrowerOnboardingPage — step wizard (Profile → BI Check → Done)
- [x] Web: TrusteeOnboardingPage — trustee profile setup (name, type, institution)
- [x] Web: BorrowerDashboard — onboarding checklist banner with progress tracking
- [x] Web: BorrowerPengaturanPage — settings with change password, role change request, logout
- [x] Web: BorrowerLayout — updated to 3 tabs (Pinjaman, Profil, Pengaturan)
- [x] Web: App.tsx — updated routing with onboarding redirects
- [x] Web: Auth store — added setRole, fetchProfile, hasNoRole

## Next Steps
- Contract PDF generation polish
- Responsive polish & accessibility
- Email notification expansion
- Admin dashboard expansion

## Fase 5: Loan Lifecycle UI ✅

- [x] PaymentProofsPage — dedicated page for lenders to review all payment proofs with filter tabs (Menunggu/Diterima/Ditolak), image preview, inline verify/reject
- [x] GET /payment-proofs?status=pending|verified|rejected — server endpoint for fetching proofs with status filter
- [x] BerandaPage badge link updated to /bukti-bayar
- [x] Loan settings toggle UI in PinjamanDetailPage — toggle reminderEnabled and doaLunasEnabled per loan
- [x] PATCH /loans/:id/settings — server endpoint for updating loan settings
- [x] IconMessageCircle added to Icons.tsx

## Fase 6: Production Readiness ✅

- [x] Contract PDF generation — generate PDF saat loan activated via PATCH /loans/:id/status, download button di PinjamanDetailPage (lender) dan BorrowerLoanDetailPage (borrower)
- [x] Forgot/Reset Password — sudah lengkap (server endpoints + UI + email template + rate limiting + token expiration)
- [x] Vite allowedHosts — ditambahkan `allowedHosts: true` untuk cloudflared tunnel support
- [x] Error handling polish — API client retry logic (2x), offline detection, user-friendly error messages, offline banner di semua layout, enhanced ErrorBoundary dengan stack trace (dev)
- [x] Seed data script — `npm run db:seed` di server: 5 users (lender, 2 borrowers, admin, trustee), 3 loans (active, completed, pending), installments, completion message, lender rating
- [x] Docker production config — Multi-stage builds, health checks, volume mounts untuk uploads, .dockerignore, .env.example, nginx-web.conf dengan security headers & cache static assets

## Fase 7: Enhancement (In Progress)

- [x] Lender dashboard analytics — GET /loans/analytics endpoint, CSS-only bar charts (no external library), repayment rate, total disbursed/returned/outstanding, monthly trend 6 bulan, purpose breakdown di BerandaPage
- [x] Borrower credit score visual — GET /borrower/credit-score endpoint, tier progression bar, next tier requirements (loans needed + on-time %), repayment stats (completed/active/on-time%), tier badges, total borrowed + plafon display di BorrowerProfilPage
- [x] Trustee notification system — Email notifikasi saat trustee accept/decline request, collateral returned. 3 template email baru: sendTrusteeRequestEmail, sendTrusteeResponseEmail, sendCollateralReturnedEmail
- [x] Mobile PWA — manifest.json, service worker (cache-first strategy), PWA meta tags (apple-mobile-web-app-capable, theme-color), apple-touch-icon, install-ready
- [x] Multi-language (i18n) — Dictionary-based i18n system (ID/EN), language toggle in ProfilPage, localStorage persistence, 60+ translation keys, IconGlobe added

## Technical Debt & Bug Fixes ✅

- [x] Borrower upload proof — diganti dari hardcoded fetch ke `api.upload()` client
- [x] `as any` usage — `loans.ts:263` dan `check-admin.ts:27` diganti proper types (`isNull` dari drizzle-orm)
- [x] File storage abstraction — `lib/storage.ts` dibuat siap untuk S3/cloud storage swap
- [x] Rate limiting — sudah ada di semua auth endpoints (register, login, forgot/reset password)
- [x] JWT refresh token rotation — sudah diimplementasi di `/auth/refresh` (delete old, insert new)

## Fase 9: Offline & Bulk Operations ✅

- [x] Offline mode polish — React Query persist to localStorage via `@tanstack/react-query-persist-client`, API client localStorage cache fallback (5 min TTL), stale data display when offline, `gcTime: 24h`, `refetchOnWindowFocus: false`
- [x] Password strength meter — Added to ProfilPage change password form with 4-bar visual indicator, strength label (Lemah/Cukup/Kuat/Sangat Kuat), password match confirmation
- [x] Export data — CSV export button on PinjamanPage with loan code, borrower alias, amount, purpose, duration, status, date, collateral type
- [x] Bulk operations — Checkbox select all/individual on AdminRoleChangesPage, bulk approve/reject with confirmation, export CSV for role change requests, responsive column hiding

## Fase 10: Two-Factor Authentication ✅

- [x] Server-side TOTP — `otpauth` library, `lib/totp.ts` utility (generateSecret, generateUri, verifyToken)
- [x] Auth endpoints — `/auth/2fa/setup`, `/auth/2fa/enable`, `/auth/2fa/disable`, `/auth/verify-2fa`, `/auth/2fa/status`
- [x] Login flow — Returns `{ twoFactorRequired: true, userId, user }` when admin has 2FA enabled
- [x] Client-side 2FA — `AdminTwoFactorSetupPage.tsx` (setup, verify, success, disable states), QR code via external API, secret key display
- [x] Auth store — `verify2fa` action, `twoFactorRequired` handling in login
- [x] useAuth hook — Exposes `verify2fa` for components
- [x] Admin navigation — 2FA link in AdminLayout sidebar nav with IconShield, i18n translations (ID: "Autentikasi 2FA", EN: "2FA Authentication")
- [x] Route — `/admin/2fa` added to App.tsx routes

## Fase 11: Push Notifications ✅

- [x] Server web-push — `web-push` library installed, VAPID keys via env vars (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`)
- [x] Push utility — `lib/push.ts` with `sendPushNotification(userId, payload)` and `sendPushToMultiple(userIds, payload)`, auto-cleanup expired subscriptions (410/404)
- [x] DB schema — `push_subscriptions` table (user_id, endpoint, p256dh, auth, created_at) with indexes
- [x] Push routes — `POST /push/subscribe`, `POST /push/unsubscribe`, `GET /push/public-key`, `POST /push/test` (all auth-protected)
- [x] Service worker — `sw.js` updated with push event handler (JSON payload parsing, notification display), notificationclick handler (opens URL or focuses existing window)
- [x] Client hook — `usePushNotification()` with subscribe/unsubscribe/test, permission request, `urlBase64ToUint8Array` helper, subscription state management
- [x] Settings UI — Push notification toggle in PengaturanPage with IconBell, status indicator, test notification button, error display
- [x] Cron integration — Payment reminder push notifications (H-3 and H-0) sent to both borrower and lender alongside email
- [x] Payment proof push — Verified notification to borrower + lender, rejected notification to borrower with upload prompt
- [x] Loan status push — Approved, activated, cancelled, defaulted notifications to borrower with deep links
- [x] Migration — `drizzle-kit generate` created migration for `push_subscriptions` table

## Fase 12: Email Verification Flow ✅

- [x] DB schema — `email_verification_tokens` table (user_id, token, expires_at, used_at, created_at) with indexes
- [x] Server endpoints — `GET /auth/verify-email?token=xxx` (verifies token, sets isVerified=true), `POST /auth/resend-verification` (sends new verification email)
- [x] Registration flow — Creates verification token, sends verification email via `sendEmailVerification()`, returns `emailVerificationRequired: true` flag
- [x] Login flow — Checks `user.isVerified`, returns `emailVerificationRequired: true` if unverified, throws error on client
- [x] Web page — `VerifyEmailPage.tsx` with 4 states: verifying (loading), success (green check), error (red X), resend (email input form)
- [x] Route — `/verify-email` added to App.tsx as public route
- [x] SignUpPage — After registration, redirects to `/verify-email?email=xxx` instead of `/onboarding`
- [x] LoginPage — Catches "Email belum diverifikasi" error, redirects to `/verify-email?email=xxx`
- [x] Auth store — `register()` returns `{ emailVerificationRequired, email }`, `login()` throws error for unverified users
- [x] Email template — `[AMANAH app] Verifikasi Email` with 24-hour expiration, branded header/footer
- [x] Test — Verified end-to-end: user created → email sent → token verified → isVerified=true