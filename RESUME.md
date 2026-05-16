# RESUME.md — Amanah: Platform Qardhul Hasan Berbasis Komunitas
https://amanah.abdura.site

## 📌 Tentang Aplikasi

**Amanah** adalah aplikasi web mobile-friendly untuk mencatat dan mengelola **Qardhul Hasan** — pinjaman kebajikan Islam tanpa bunga yang berbasis komunitas (konsep BMT / Baitul Maal wat Tamwil).

**Filosofi:** Membantu masyarakat saling membantu melalui pinjaman tanpa riba, dengan sistem yang transparan, amanah, dan berbasis kepercayaan antar anggota komunitas.

---

## ✨ Fitur Utama

### Untuk Pemberi Pinjaman (Lender)
- Dashboard ringkasan + analytics (repayment rate, trend bulanan)
- Catat & kelola pinjaman (CRUD)
- Review pengajuan pinjaman dari peminjam
- Verifikasi bukti transfer cicilan
- Download kontrak pinjaman (PDF)
- Toggle pengingat pembayaran & doa lunas

### Untuk Peminjam (Borrower)
- Ajukan pinjaman dengan fee preview transparan
- Upload bukti transfer cicilan
- Kirim "Doa Lunas" (pesan syukur) saat pinjaman lunas
- Beri rating pemberi pinjaman
- Tier otomatis naik seiring rekam jejak baik

### Untuk Wali Amanah (Trustee)
- Dashboard pengelolaan jaminan
- Verifikasi & update status collateral
- Notifikasi permintaan jaminan baru

### Untuk Admin
- Panel admin lengkap (users, loans, trustees, audit logs)
- Review dokumen KTP
- Review perubahan role
- Export data CSV
- Dark mode

### Fitur Umum
- Auth: Register, Login, Forgot/Reset Password
- Role-based access (Lender / Borrower / Trustee / Admin)
- Email notifikasi (10 template)
- Offline detection + retry logic
- Dark mode

---

## 🛠 Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React + TypeScript, Tailwind CSS v4, React Router v7 |
| **Backend** | Hono (Node.js), TypeScript, Zod validation |
| **Database** | PostgreSQL 16, Drizzle ORM |
| **Auth** | Custom JWT (bcrypt 12 rounds), refresh token rotation |
| **Email** | Resend API |
| **PDF** | PDFKit |
| **State** | Zustand + React Query |
| **DevOps** | Docker Compose, Nginx reverse proxy, Cloudflare Tunnel |

---

## 📐 Arsitektur

```
Monorepo (npm workspaces)
├── packages/web/      — Vite + React (frontend)
├── packages/server/   — Hono + Drizzle (REST API)
└── packages/shared/   — Shared TypeScript types
```

---

## 📊 Status Saat Ini

| Komponen | Progress |
|---|---|
| Fase 1: Project Setup | ✅ 100% |
| Fase 2: Web App UI | ✅ 100% |
| Fase 3: BMT Cycle | ✅ 100% |
| Fase 4: Onboarding Flow | ✅ 100% |
| Fase 5: Loan Lifecycle | ✅ 100% |
| Fase 6: Production Ready | ✅ 100% |
| Fase 7: Enhancement | ⏳ 20% |

**Kesiapan Production: ~90%** — Core features lengkap, tinggal konfigurasi environment untuk deploy.

---

## 🚀 Cara Menjalankan

```bash
# Install dependencies
npm install

# Start database
docker compose up -d postgres

# Push schema
cd packages/server && npx drizzle-kit push

# Seed demo data (opsional)
npm run db:seed

# Start servers
cd packages/server && npm run dev   # API: localhost:3001
cd packages/web && npm run dev      # Web: localhost:5173
```

---

## 👥 Tim

Dibangun oleh tim Vibathon dengan bantuan AI coding assistant.

---

## 📝 Catatan

- Aplikasi ini **tanpa bunga/riba** — murni pinjaman kebajikan
- Peminjam punya akun sendiri (bukan anonim)
- Jaminan dipegang wali amanah (pihak ketiga)
- Semua kode TypeScript, tanpa `any`
