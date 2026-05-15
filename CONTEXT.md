# CONTEXT.md — Panduan untuk AI Coding Agent

> Baca file ini sebelum mengerjakan task apapun. Ini adalah sumber kebenaran tunggal (single source of truth) untuk proyek Amanah.

## Apa itu Amanah?

Aplikasi mobile-friendly web app untuk mencatat **Qardhul Hasan** (pinjaman kebajikan Islam tanpa bunga) berbasis **komunitas** (konsep BMT — Baitul Maal wat Tamwil). Fitur utama:

- **Berbasis komunitas** — peminjam dan pemberi pinjaman adalah anggota komunitas yang saling kenal
- Peminjam punya **akun sendiri** (bukan anonim) dengan tier yang naik seiring rekam jejak
- Jaminan **dipegang wali amanah** (pihak ketiga), bukan pemberi pinjaman
- Login via **email + password** dengan JWT (lender/borrower)
- Fitur **"doa lunas"** — peminjam bisa kirim pesan syukur saat melunasi
- **Pinjaman konsumtif & produktif** — bukan untuk ibadah (umroh/haji)
- Tujuan pinjaman: Modal Usaha, Perumahan, Konsumtif, Pendidikan, Kesehatan, Kebutuhan Mendesak, Kebutuhan Keluarga, Pelunasan Hutang

---

## Arsitektur — Monorepo

```
amanah/
├── packages/
│   ├── web/        Vite + React + Tailwind CSS v4 — mobile-friendly web app
│   ├── server/     Hono + Drizzle ORM — REST API server
│   └── shared/     Tipe & konstanta bersama (TypeScript)
├── docker-compose.yml   PostgreSQL + API + Web + Nginx
├── nginx.conf            Reverse proxy config untuk production
├── CONTEXT.md            ← Anda sedang membaca ini
├── PROGRESS.md           Log progres development
└── docs/
    ├── PRD.md            Product Requirements Document
    └── SCHEMA.md         Database schema (SQL reference)
```

### Auth Flow (Custom JWT + Email/Password)

```
┌──────────┐     POST /auth/register      ┌──────────┐
│  Browser  │────────────────────────────▶│  Server  │
│  (React)  │     POST /auth/login         │  (Hono)  │
│           │────────────────────────────▶│          │
│           │◀─ JWT access + refresh ─────│          │
│           │                              │          │
│           │─ Authorization: Bearer ─────▶│          │
│           │  (setiap request)            │          │
└──────────┘                              └────┬─────┘
                                               │
                                          ┌────▼─────┐
                                          │PostgreSQL│
                                          │ (Docker) │
                                          └──────────┘
```

1. Client POST `/auth/register` dengan email + password + (opsional) displayName → buat user baru → issue JWT
2. Client POST `/auth/login` dengan email + password → verifikasi → issue JWT access (1h) + refresh (30d)
3. Server hash password pakai bcrypt (12 rounds)
4. Client simpan token di localStorage, kirim di setiap request via `Authorization: Bearer <token>`

### API Server (Hono + Drizzle)

- **Hono**: HTTP framework ringan dengan TypeScript support, berjalan di Node.js
- **Drizzle ORM**: Type-safe ORM untuk PostgreSQL dengan schema-first approach
- **JWT**: Access token (1h) + Refresh token (30d), di-sign pakai `JWT_SECRET`
- **bcrypt**: Password hashing (12 rounds)
- **Zod**: Request validation pada setiap endpoint
- **CORS**: Dikonfigurasi via `CORS_ORIGIN` env var

**Endpoint yang sudah ada:**
| Method | Path | Deskripsi | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register user baru | Public |
| POST | `/auth/login` | Login user | Public |
| GET | `/health` | Health check | Public |
| GET | `/loans` | Daftar pinjaman lender | Protected |
| POST | `/loans` | Buat pinjaman baru | Protected |
| GET | `/loans/:id` | Detail pinjaman | Protected |
| GET | `/loans/code/:loanCode` | Tracking borrower (publik) | Public |
| GET | `/trustees` | Daftar trustee | Protected |

### Web App (Vite + React + Tailwind CSS v4)

- **React Router v7**: Client-side routing dengan protected routes
- **Tailwind CSS v4**: Utility-first styling (mobile-first responsive), custom color variables via `@theme`
- **Zustand**: State management (auth store)
- **React Query**: Data fetching & caching (sudah di-setup, belum dipakai untuk API queries)
- **localStorage**: Token persistence (access + refresh token)
- **Vite Dev Proxy**: `/api/*` di-proxikan ke `http://localhost:3001` saat development

### Vite Dev Proxy

Saat development, Vite proxies `/api/*` ke `http://localhost:3001`:
```
Browser → http://localhost:5173/api/auth/login → http://localhost:3001/auth/login
```
Ini menghindari CORS issues antara web dan API server.

---

## Database Schema — 7 Tables

```
users                          loans
├── id (UUID, PK)              ├── id (UUID, PK)
├── email (unique)             ├── loan_code (unique, AMN-XXXX)
├── password_hash (bcrypt)     ├── lender_id (FK → users.id)
├── role (lender/trustee/admin)├── borrower_alias (BUKAN nama asli)
├── display_name               ├── trustee_id (FK → trustees.id)
└── created_at                 ├── amount, duration_months
                               ├── installment_type (monthly/weekly/lump_sum/flexible)
trustees                       ├── collateral_type (document/valuables/letter/none)
├── id (UUID, PK)              ├── collateral_status (pending/held/returned)
├── profile_id (FK → users)    ├── status (active/completed/defaulted/cancelled)
├── name, type, email          ├── hide_borrower, reminder_enabled, doa_lunas_enabled
├── institution, is_verified   └── created_at, updated_at
├── created_by (FK → users)
└── created_at                 installments
                               ├── id (UUID, PK)
completion_messages            ├── loan_id (FK → loans.id)
├── id (UUID, PK)              ├── period_label, amount, due_date
├── loan_id (FK → loans.id)   ├── paid_at, status (unpaid/processing/paid)
├── message (anonim by design)├── confirmed_by
└── created_at                 └── created_at

trustee_requests               refresh_tokens
├── id (UUID, PK)              ├── id (UUID, PK)
├── loan_id (FK → loans.id)    ├── user_id (FK → users.id)
├── trustee_id (FK → trustees) ├── token (unique)
├── status (pending/accepted/declined)  ├── expires_at
├── responded_at               └── created_at
└── created_at
```

**Borrower punya akun sendiri.** Mereka login via email/password dan mengakses endpoint `/borrower/*` yang membutuhkan autentikasi.

---

## Halaman Web — Route Map

| Route | Halaman | Auth | Status |
|---|---|---|---|
| `/login` | Masuk (email/password) | Public | ✅ Done |
| `/signup` | Daftar akun baru | Public | ✅ Done |
| `/` | Beranda (dashboard) | Protected | ✅ UI only |
| `/pinjaman` | Daftar pinjaman | Protected | ✅ UI only |
| `/pinjaman/baru` | Catat pinjaman baru | Protected | ✅ UI only |
| `/pinjaman/baru/success` | Sukses buat pinjaman | Protected | ✅ UI only |
| `/pinjaman/:id` | Detail pinjaman | Protected | ✅ UI only |
| `/wali-amanah` | Daftar wali amanah | Protected | ✅ UI only |
| `/wali-amanah/undang` | Undang wali baru | Protected | ✅ UI only |
| `/profil` | Profil pengguna | Protected | ✅ Done |
| `/pengaturan` | Pengaturan | Protected | ✅ UI only |
| `/track` | Lacak pinjaman (borrower) | Public | ✅ UI only |
| `/track/:loanCode` | Detail cicilan (borrower) | Public | ✅ UI only |

### Bottom Navigation (5 tabs)
1. **Beranda** (🏠 Home icon) — Dashboard ringkasan
2. **Pinjaman** (📋 Loan icon) — Daftar pinjaman
3. **Wali** (🤝 Trustee icon) — Daftar wali amanah
4. **Profil** (👤 User icon) — Profil pengguna
5. **Pengaturan** (⚙️ Settings icon) — Pengaturan akun

---

## Domain & Terminologi

Selalu gunakan istilah ini agar konsisten di kode, komentar, dan nama variabel:

| Istilah | Arti | Singkatan di kode |
|---|---|---|
| Pemberi pinjaman | User yang meminjamkan uang | `lender` |
| Peminjam | Pihak yang meminjam | `borrower` |
| Wali amanah | Pihak ketiga pemegang jaminan | `trustee` |
| Kode amanah | ID unik pinjaman (format: `AMN-XXXX`) | `loanCode` |
| Jaminan | Aset yang dititipkan ke wali | `collateral` |
| Cicilan | Pembayaran berkala | `installment` |
| Doa lunas | Pesan anonim saat lunas | `completionMessage` |

---

## Keputusan Teknis yang Sudah Final

- **Vite + React** untuk web app (mobile-friendly responsive)
- **React Router v7** untuk client-side routing
- **Tailwind CSS v4** untuk styling (custom `@theme` tokens)
- **Hono** untuk REST API server
- **Drizzle ORM** untuk type-safe database access
- **PostgreSQL** via Docker (atau lokal port 5432)
- **Custom JWT auth** dengan email/password (bcrypt hashing, 12 rounds)
- **nanoid** untuk generate `loan_code` (format: `AMN-` + 4 karakter uppercase)
- **TypeScript** wajib di semua file
- **Zustand** + **React Query** untuk state management web
- **Monorepo** structure (packages/web, packages/server, packages/shared)
- **SVG Icons** di web (bukan emoji) — komponen di `Icons.tsx`
- **Pinjaman konsumtif & produktif** — BUKAN untuk ibadah (umroh/haji)

---

## Konvensi Kode

```typescript
// Nama file: kebab-case
// loan-card.tsx, use-loans.ts

// Nama komponen: PascalCase
// LoanCard, TrusteeSelector

// Nama fungsi/variabel: camelCase
// getLoanByCode, createInstallment

// Nama route file: kebab-case
// pinjaman-baru.tsx, PinjamanBaruPage.tsx (pages)

// Tipe/interface: PascalCase dengan prefix I untuk interface
// ILoan, ITrustee, IInstallment

// Konstanta: SCREAMING_SNAKE_CASE
// LOAN_STATUS, MAX_LOAN_DURATION_MONTHS
```

---

## Environment Variables

### Server (`packages/server/.env`)
```
DATABASE_URL=postgresql://amanah:amanah_dev@localhost:5432/amanah
JWT_SECRET=change-me-in-production
RESEND_API_KEY=re_xxx
FROM_EMAIL=Amanah <no-reply@amanah.app>
CORS_ORIGIN=*
PORT=3001
```

### Web (`packages/web/.env`)
```
VITE_API_URL=/api
```

---

## Cara Menjalankan

```bash
# 1. Install dependencies (root)
npm install

# 2. Start PostgreSQL (jika pakai Docker)
docker compose up -d postgres

# 3. Push database schema
cd packages/server
npx drizzle-kit push

# 4. Start API server
cd packages/server && npm run dev

# 5. Start web app (terminal baru)
cd packages/web && npm run dev
```

Web app: http://localhost:5173
API server: http://localhost:3001

---

## Hal yang TIDAK BOLEH dilakukan

- Jangan buat fitur "leaderboard" atau tampilan publik lender
- Jangan tambahkan field untuk bunga/denda keterlambatan
- Jangan gunakan `any` di TypeScript
- Jangan expose `JWT_SECRET` ke client/web
- Jangan expose `RESEND_API_KEY` ke client/web
- Jangan tambahkan `worship` (ibadah) di loan_purpose — pinjaman bukan untuk ibadah
- Jangan kembalikan fitur tracking anonim via loan_code — peminjam harus punya akun

---

## Status Saat Ini

Lihat `PROGRESS.md` untuk task yang sudah selesai dan yang sedang dikerjakan.

### Yang sudah berjalan:
- ✅ Web app build & dev server (Vite)
- ✅ API server (Hono) dengan auth endpoints (register/login)
- ✅ Database schema pushed ke PostgreSQL
- ✅ Sign Up & Sign In pages di web
- ✅ Bottom navigation 5 tab dengan SVG icons
- ✅ Dashboard, Profil, Pengaturan pages (UI)
- ✅ JWT auth flow di web (localStorage)
- ✅ Protected routes (redirect ke /login jika belum auth)

### Yang belum diimplementasi:
- ❌ Loan CRUD terhubung ke API (form → API call)
- ❌ Borrower tracking page (`/track/:loanCode`) terhubung ke API
- ❌ Trustee CRUD endpoints & UI
- ❌ Cicilan endpoints & UI
- ❌ Doa lunas endpoint & UI
- ❌ Dashboard menampilkan data real dari API
- ❌ Email notifikasi (Resend)
- ❌ Refresh token rotation
- ❌ Password change / reset