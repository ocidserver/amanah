# EXPLORATORY-TESTING.md — Hasil Exploratory Testing

> Tanggal: 2026-05-16
> Aplikasi: Amanah Qardhul Hasan Platform

---

## 1. User Journey Testing

### 1.1 Lender Journey: End-to-End Loan Lifecycle
| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Register sebagai lender | User created, role = lender | ✅ PASS |
| 2 | Login | JWT issued, redirect ke dashboard | ✅ PASS |
| 3 | Buat pinjaman baru | Loan created, status = pending | ✅ PASS |
| 4 | Invite borrower via email | Invitation created, email sent | ✅ PASS |
| 5 | Approve pengajuan borrower | Status → approved | ✅ PASS |
| 6 | Activate loan | Status → active, installments generated, contract PDF | ✅ PASS |
| 7 | Terima bukti bayar dari borrower | Proof status = pending | ✅ PASS |
| 8 | Verifikasi bukti bayar | Proof → verified, installment → paid | ✅ PASS |
| 9 | Semua cicilan lunas | Loan → completed, tier updated | ✅ PASS |
| 10 | Terima doa lunas | Completion message visible | ✅ PASS |
| 11 | Lihat rating dari borrower | Rating visible di profil | ✅ PASS |

### 1.2 Borrower Journey: Apply → Pay → Complete
| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Register sebagai borrower | User created, role = borrower | ✅ PASS |
| 2 | Lengkapi profil | profileCompleted = true | ✅ PASS |
| 3 | BI Checking | Status = pending/approved/rejected | ✅ PASS |
| 4 | Ajukan pinjaman | Loan created, status = pending | ✅ PASS |
| 5 | Loan disetujui & diaktifkan | Status → approved → active | ✅ PASS |
| 6 | Upload bukti bayar cicilan 1 | Proof saved, status = pending | ✅ PASS |
| 7 | Bukti diverifikasi lender | Proof → verified, installment → paid | ✅ PASS |
| 8 | Ulangi untuk semua cicilan | Semua installments → paid | ✅ PASS |
| 9 | Kirim doa lunas | Message saved | ✅ PASS |
| 10 | Beri rating lender | Rating saved, avg updated | ✅ PASS |

### 1.3 Trustee Journey: Accept → Hold → Return
| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Register sebagai trustee | User created, role = trustee | ✅ PASS |
| 2 | Terima permintaan wali | Request status → accepted | ✅ PASS |
| 3 | Verifikasi jaminan | collateralStatus → held | ✅ PASS |
| 4 | Upload bukti jaminan | collateralProofUrl saved | ✅ PASS |
| 5 | Loan completed → kembalikan jaminan | collateralStatus → returned | ✅ PASS |

### 1.4 Admin Journey: Review → Manage
| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Login sebagai admin | Redirect ke /admin | ✅ PASS |
| 2 | Review pengguna | List users, search, filter | ✅ PASS |
| 3 | Review pinjaman | List loans, pagination, search | ✅ PASS |
| 4 | Review dokumen KTP | Grid view KTP images | ✅ PASS |
| 5 | Review perubahan role | Accept/reject role change requests | ✅ PASS |
| 6 | Lihat audit logs | Filter by entity, pagination | ✅ PASS |
| 7 | Export data CSV | Download CSV file | ✅ PASS |

---

## 2. Cross-Role Testing

| # | Test | Deskripsi | Status |
|---|---|---|---|
| 2.1 | Role switching | Borrower request → lender, admin approve | ✅ PASS |
| 2.2 | Permission escalation | Lender coba akses /borrower/* endpoints | ✅ PASS — 403 |
| 2.3 | Multi-role user | User dengan role null → set role | ✅ PASS |
| 2.4 | Protected route redirect | Unauthenticated → /login | ✅ PASS |
| 2.5 | Admin access from non-admin | Non-admin → /admin → redirect | ✅ PASS |

---

## 3. Real-World Scenarios

| # | Scenario | Deskripsi | Status |
|---|---|---|---|
| 3.1 | Late Payment Reminder | Installment due H-3 dan H-0, cron trigger | ✅ PASS |
| 3.2 | Rejected Proof Re-upload | Lender reject → borrower re-upload → verify | ✅ PASS |
| 3.3 | Loan Default | Lender mark defaulted → borrower tier affected | ✅ PASS |
| 3.4 | Multiple Active Loans | Borrower 2 loans, verify tier limit | ✅ PASS |
| 3.5 | Trustee Decline Request | Trustee decline → lender notified | ✅ PASS |
| 3.6 | Expired Invitation | Invite token expired → cannot accept | ✅ PASS |
| 3.7 | Contract Download | Loan activated → contract PDF generated → download | ✅ PASS |
| 3.8 | Offline Detection | Network lost → offline banner shown | ✅ PASS |
| 3.9 | Dark Mode Persistence | Toggle dark mode → reload → persists | ✅ PASS |
| 3.10 | Language Toggle | Switch ID/EN → reload → persists | ✅ PASS |

---

## 4. Edge Scenarios

| # | Scenario | Deskripsi | Status |
|---|---|---|---|
| 4.1 | First-time user | Register → onboarding → role selection | ✅ PASS |
| 4.2 | Incomplete profile | Borrower belum lengkap profil → cannot apply | ✅ PASS |
| 4.3 | BI rejected | BI check rejected → cannot apply | ✅ PASS |
| 4.4 | Tier limit exceeded | Borrower apply > tier max → rejected | ✅ PASS |
| 4.5 | Duplicate doa lunas | Send doa twice → 409 Conflict | ✅ PASS |
| 4.6 | Rating before completion | Rate lender before loan completed → 400 | ✅ PASS |
| 4.7 | Cancel with paid installments | Cancel loan with paid cicilan → allowed | ✅ PASS |
| 4.8 | Default with paid installments | Default loan with paid cicilan → blocked | ✅ PASS |

---

## 📊 Summary

| Kategori | Total Tests | Passed | Failed |
|---|---|---|---|
| User Journeys | 30 | 30 | 0 |
| Cross-Role | 5 | 5 | 0 |
| Real-World Scenarios | 10 | 10 | 0 |
| Edge Scenarios | 8 | 8 | 0 |
| **TOTAL** | **53** | **53** | **0** |

## ✅ Kesimpulan

Semua user journey, cross-role tests, real-world scenarios, dan edge scenarios berfungsi dengan benar. 53/53 tests passed.
