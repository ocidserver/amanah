# Amanah — Qardhul Hasan Digital

> Platform pencatatan pinjaman kebajikan yang transparan namun menjaga privasi peminjam.

## Visi

Qardhul Hasan adalah salah satu amalan mulia dalam Islam — meminjamkan harta tanpa mengharapkan lebih dari pokoknya. Namun selama ini pengelolaannya hanya mengandalkan ingatan dan kepercayaan lisan, yang sering berujung salah paham atau mempermalukan peminjam.

**Amanah** hadir sebagai cara baru mengelola pinjaman kebajikan secara digital: transparan bagi dua pihak, terlindungi dari publik, dan diperkuat dengan sistem jaminan yang dikelola wali amanah (pihak ketiga terpercaya).

## Arsitektur

```
┌────────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  Web (Vite+React)  │────▶│  API (Hono+Drizzle)  │────▶│  PostgreSQL │
│  Tailwind CSS      │◀────│  JWT + OTP Auth       │◀────│  (Docker)   │
│  React Router      │     │  Resend Email         │     └─────────────┘
└────────────────────┘     └──────────────────────┘
         │                          │
    Nginx proxy            Resend API
    (production)
```

Monorepo structure:
- **`packages/web`** — Vite + React + Tailwind (mobile-friendly web app)
- **`packages/server`** — Hono + Drizzle REST API
- **`packages/shared`** — Shared TypeScript types & constants

## Stack Teknologi

| Layer | Teknologi |
|---|---|
| Web App | Vite + React + Tailwind CSS v4 + React Router |
| API | Hono (Node.js) + Drizzle ORM |
| Database | PostgreSQL (Docker) |
| Autentikasi | Custom JWT + OTP via Resend |
| ID generator | nanoid |
| State management | Zustand + React Query |

## Cara Mulai

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
docker compose up -d postgres

# 3. Setup database schema
cd packages/server
npx drizzle-kit push

# 4. Copy env files
cp packages/server/.env.example packages/server/.env
cp packages/web/.env.example packages/web/.env

# 5. Start API server
cd packages/server && npm run dev

# 6. Start web app (di terminal baru)
cd packages/web && npm run dev
```

Aplikasi web akan berjalan di http://localhost:5173 dan API server di http://localhost:3001.

### Production

```bash
docker compose up -d
```

Aplikasi berjalan di http://localhost:80 via Nginx reverse proxy.

## Prinsip Desain

1. **Privasi peminjam** — tidak ada nama asli di sistem, hanya kode unik
2. **Jaminan bermartabat** — jaminan dipegang wali amanah, bukan pemberi pinjaman langsung
3. **Tanpa riba** — platform tidak memfasilitasi bunga dalam bentuk apapun
4. **Data minimal** — tidak ada profiling, tidak ada iklan, hapus otomatis setelah lunas
5. **Mobile-first** — dirancang untuk tampilan smartphone

Baca `CONTEXT.md` sebelum mulai coding — berisi semua keputusan arsitektur yang perlu dipahami AI agent.