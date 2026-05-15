# PROGRESS.md — Log Progres Development

## Fase 1: Project Setup ✅

- [x] Inisialisasi monorepo (packages/web, packages/server, packages/shared)
- [x] packages/web — Vite + React + Tailwind CSS v4 + React Router
- [x] packages/server — Hono + Drizzle REST API server
- [x] packages/shared — Shared TypeScript types & constants
- [x] Docker Compose untuk PostgreSQL + API + Nginx
- [x] Drizzle ORM schema (7 tabel: users, loans, installments, trustees, completion_messages, trustee_requests, refresh_tokens)
- [x] Auth endpoints: POST /auth/register, POST /auth/login (email + password + bcrypt)
- [x] JWT middleware untuk protected routes
- [x] Password hashing dengan bcrypt (12 rounds)
- [x] Loan endpoints: GET /loans, POST /loans (auto-generate installments), GET /loans/:id, GET /loans/code/:loanCode (public)
- [x] Trustee endpoints: GET /trustees, POST /trustees, GET /trustees/:id
- [x] Installment endpoints: GET /installments/loan/:loanId, PATCH /installments/:id/confirm
- [x] Completion messages endpoints: GET /completion-messages/loan/:loanId, POST /completion-messages/loan/:loanId
- [x] Web: Auth pages (Sign In / Sign Up)
- [x] Web: Dashboard layout with bottom tab navigation (5 tabs + SVG icons)
- [x] Web: 14 SVG icon components (Home, Loan, Trustee, User, Settings, Plus, etc.)
- [x] Web: API client with JWT auth (localStorage)
- [x] Web: Zustand auth store (register, login, signOut, restoreSession)
- [x] Shared types & constants dari @amanah/shared

## Fase 2: Fitur Inti ✅ (in progress)

- [x] Loan creation form wired to API (POST /loans → auto-generate installments)
- [x] Dashboard menampilkan data real dari API (total aktif, total lunas, daftar pinjaman)
- [x] Pinjaman list page fetches real data from API
- [x] Loan detail page shows loan info, progress bar, installment history
- [x] Borrower tracking page (public) fetches data via GET /loans/code/:loanCode
- [x] Trustee list page fetches real data from API
- [x] Trustee creation form wired to API (POST /trustees)

## Fase 3: Polish & Completeness (Berikutnya)

- [ ] Installment confirmation from lender UI
- [ ] Doa lunas UI (POST /completion-messages)
- [ ] Email notifications via Resend
- [ ] Refresh token rotation
- [ ] Password change / reset
- [ ] Responsive polish & accessibility
- [ ] Loading states & error boundaries
- [ ] Empty states for all pages