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
- [ ] B1: Trustee verification — activate trustee_requests flow
- [ ] C1: Transfer proof upload — payment_proofs endpoints + web UI
- [ ] C2: Reminder H-3/H-0 — cron endpoint + scheduled logic
- [ ] Contract PDF generation + e-signature

### Blocked
- (none)

## Next Steps
- Trustee collateral verification flow (trustee_requests table exists but unused)
- Role change request UI (endpoint exists, no web UI)
- Contract PDF generation (puppeteer/pdfkit)
- Payment proof upload (multipart, image storage)
- Email: payment reminders (scheduled), trustee invitation
- Password reset/forgot password flow
- Responsive polish & accessibility