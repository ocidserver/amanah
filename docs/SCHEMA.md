# SCHEMA.md — Database Schema

Semua tabel di Supabase (PostgreSQL). Jalankan SQL ini di Supabase SQL Editor secara berurutan.

---

## 1. Enable UUID Extension

```sql
create extension if not exists "uuid-ossp";
```

---

## 2. Tabel `profiles`

Ekstensi dari `auth.users` Supabase. Dibuat otomatis saat user pertama login.

```sql
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  role        text not null default 'lender' check (role in ('lender', 'trustee', 'admin')),
  display_name text,
  created_at  timestamptz not null default now()
);

-- Auto-create profile saat user baru mendaftar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "User bisa lihat profil sendiri"
  on public.profiles for select
  using (auth.uid() = id);

create policy "User bisa update profil sendiri"
  on public.profiles for update
  using (auth.uid() = id);
```

---

## 3. Tabel `trustees`

```sql
create table public.trustees (
  id            uuid default uuid_generate_v4() primary key,
  profile_id    uuid references public.profiles(id) on delete cascade,
  name          text not null,
  type          text not null check (type in ('personal', 'institution')),
  email         text,
  institution   text,                    -- nama masjid/lembaga jika type=institution
  is_verified   boolean default false,   -- diverifikasi admin platform
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- RLS
alter table public.trustees enable row level security;

create policy "Lender bisa lihat semua trustee"
  on public.trustees for select
  using (auth.role() = 'authenticated');

create policy "Lender bisa tambah trustee personal"
  on public.trustees for insert
  with check (auth.uid() = created_by and type = 'personal');
```

---

## 4. Tabel `loans`

Tabel utama. Privasi: `borrower_alias` bukan nama asli.

```sql
create table public.loans (
  id                  uuid default uuid_generate_v4() primary key,
  loan_code           text not null unique,             -- format: AMN-XXXX
  lender_id           uuid references auth.users(id) not null,
  borrower_alias      text not null default 'Peminjam', -- BUKAN nama asli
  trustee_id          uuid references public.trustees(id),
  amount              integer not null check (amount > 0), -- dalam rupiah
  duration_months     integer not null check (duration_months > 0),
  installment_type    text not null default 'monthly'
                        check (installment_type in ('monthly', 'weekly', 'lump_sum', 'flexible')),
  collateral_type     text not null default 'none'
                        check (collateral_type in ('document', 'valuables', 'letter', 'none')),
  collateral_status   text not null default 'pending'
                        check (collateral_status in ('pending', 'held', 'returned')),
  notes_encrypted     text,                             -- opsional, dienkripsi di client
  status              text not null default 'active'
                        check (status in ('active', 'completed', 'defaulted', 'cancelled')),
  hide_borrower       boolean not null default true,
  reminder_enabled    boolean not null default true,
  doa_lunas_enabled   boolean not null default true,
  auto_delete_days    integer,                          -- null = tidak auto-delete
  start_date          date not null default current_date,
  due_date            date,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Index untuk performa
create index loans_lender_id_idx on public.loans(lender_id);
create index loans_loan_code_idx on public.loans(loan_code);
create index loans_status_idx on public.loans(status);

-- RLS
alter table public.loans enable row level security;

create policy "Lender hanya bisa lihat pinjamannya sendiri"
  on public.loans for select
  using (auth.uid() = lender_id);

create policy "Lender bisa buat pinjaman"
  on public.loans for insert
  with check (auth.uid() = lender_id);

create policy "Lender bisa update pinjamannya sendiri"
  on public.loans for update
  using (auth.uid() = lender_id);

-- Borrower akses via loan_code (tanpa auth) — gunakan service role di Edge Function
-- Jangan buat RLS policy public untuk ini; handle di server-side
```

---

## 5. Tabel `installments`

```sql
create table public.installments (
  id            uuid default uuid_generate_v4() primary key,
  loan_id       uuid references public.loans(id) on delete cascade not null,
  period_label  text not null,                  -- misal: "Februari 2025"
  amount        integer not null check (amount > 0),
  due_date      date not null,
  paid_at       timestamptz,
  status        text not null default 'unpaid'
                  check (status in ('unpaid', 'processing', 'paid')),
  confirmed_by  text,                           -- 'borrower' atau 'lender'
  created_at    timestamptz not null default now()
);

create index installments_loan_id_idx on public.installments(loan_id);

-- RLS
alter table public.installments enable row level security;

create policy "Lender bisa lihat cicilan dari pinjamannya"
  on public.installments for select
  using (
    exists (
      select 1 from public.loans
      where loans.id = installments.loan_id
        and loans.lender_id = auth.uid()
    )
  );

create policy "Lender bisa update status cicilan"
  on public.installments for update
  using (
    exists (
      select 1 from public.loans
      where loans.id = installments.loan_id
        and loans.lender_id = auth.uid()
    )
  );
```

---

## 6. Tabel `completion_messages`

Doa lunas anonim dari borrower.

```sql
create table public.completion_messages (
  id          uuid default uuid_generate_v4() primary key,
  loan_id     uuid references public.loans(id) on delete cascade not null unique,
  message     text not null check (char_length(message) <= 500),
  created_at  timestamptz not null default now()
  -- tidak ada kolom pengirim — anonim by design
);

-- RLS: hanya lender yang bisa baca
alter table public.completion_messages enable row level security;

create policy "Lender bisa baca doa lunas dari pinjamannya"
  on public.completion_messages for select
  using (
    exists (
      select 1 from public.loans
      where loans.id = completion_messages.loan_id
        and loans.lender_id = auth.uid()
    )
  );
```

---

## 7. Tabel `trustee_requests`

Tracking permintaan wali amanah.

```sql
create table public.trustee_requests (
  id              uuid default uuid_generate_v4() primary key,
  loan_id         uuid references public.loans(id) on delete cascade not null,
  trustee_id      uuid references public.trustees(id) not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'accepted', 'declined')),
  responded_at    timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.trustee_requests enable row level security;

create policy "Trustee bisa lihat request untuknya"
  on public.trustee_requests for select
  using (
    exists (
      select 1 from public.trustees
      where trustees.id = trustee_requests.trustee_id
        and trustees.profile_id = auth.uid()
    )
  );

create policy "Lender bisa lihat request dari pinjamannya"
  on public.trustee_requests for select
  using (
    exists (
      select 1 from public.loans
      where loans.id = trustee_requests.loan_id
        and loans.lender_id = auth.uid()
    )
  );
```

---

## Fungsi Helper

```sql
-- Generate loan_code unik format AMN-XXXX
create or replace function generate_loan_code()
returns text as $$
declare
  code text;
  exists_check boolean;
begin
  loop
    code := 'AMN-' || upper(substring(md5(random()::text) from 1 for 4));
    select exists(select 1 from public.loans where loan_code = code) into exists_check;
    exit when not exists_check;
  end loop;
  return code;
end;
$$ language plpgsql;

-- Update updated_at otomatis
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger loans_updated_at
  before update on public.loans
  for each row execute procedure update_updated_at();
```

---

## Tipe TypeScript (generate dari schema ini)

Simpan di `src/types/database.ts`:

```typescript
export type LoanStatus = 'active' | 'completed' | 'defaulted' | 'cancelled'
export type InstallmentStatus = 'unpaid' | 'processing' | 'paid'
export type CollateralType = 'document' | 'valuables' | 'letter' | 'none'
export type CollateralStatus = 'pending' | 'held' | 'returned'
export type InstallmentType = 'monthly' | 'weekly' | 'lump_sum' | 'flexible'
export type TrusteeType = 'personal' | 'institution'
export type TrusteeRequestStatus = 'pending' | 'accepted' | 'declined'
export type UserRole = 'lender' | 'trustee' | 'admin'

export interface ILoan {
  id: string
  loan_code: string
  lender_id: string
  borrower_alias: string
  trustee_id: string | null
  amount: number
  duration_months: number
  installment_type: InstallmentType
  collateral_type: CollateralType
  collateral_status: CollateralStatus
  notes_encrypted: string | null
  status: LoanStatus
  hide_borrower: boolean
  reminder_enabled: boolean
  doa_lunas_enabled: boolean
  auto_delete_days: number | null
  start_date: string
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface IInstallment {
  id: string
  loan_id: string
  period_label: string
  amount: number
  due_date: string
  paid_at: string | null
  status: InstallmentStatus
  confirmed_by: string | null
  created_at: string
}

export interface ITrustee {
  id: string
  profile_id: string | null
  name: string
  type: TrusteeType
  email: string | null
  institution: string | null
  is_verified: boolean
  created_by: string
  created_at: string
}

export interface ICompletionMessage {
  id: string
  loan_id: string
  message: string
  created_at: string
}
```
