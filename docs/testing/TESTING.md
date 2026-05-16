# TESTING.md — Skema Testing Amanah Qardhul Hasan Platform

> Dokumentasi lengkap skema testing untuk aplikasi Amanah. Hasil testing per kategori disimpan di file terpisah.

---

## 📁 Struktur File Testing

```
docs/testing/
├── TESTING.md                    ← Anda sedang membaca ini
├── SECURITY-TESTING.md           ← Hasil security & vulnerability testing
├── BUG-CHECK.md                  ← Hasil bug check & fixing
├── EXPLORATORY-TESTING.md        ← Hasil exploratory testing
├── PERFORMANCE-TESTING.md        ← Hasil performance testing
├── INTEGRATION-TESTING.md        ← Hasil integration testing
├── UI-UX-TESTING.md              ← Hasil UI/UX & accessibility testing
├── DATA-INTEGRITY-TESTING.md     ← Hasil data integrity testing
└── TESTING-RESUME.md             ← Ringkasan semua hasil testing
```

---

## 1. 🔒 Security Testing

### 1.1 Authentication & Authorization
| # | Test | Deskripsi | Prioritas |
|---|---|---|---|
| 1.1.1 | JWT Token Tampering | Modifikasi payload JWT, verifikasi signature validation | 🔴 Critical |
| 1.1.2 | Token Expiration | Test access token expired + refresh token rotation | 🔴 Critical |
| 1.1.3 | Role Bypass | Coba akses endpoint lender sebagai borrower | 🔴 Critical |
| 1.1.4 | Password Strength | Test password < 6 karakter, common passwords | 🟡 Medium |
| 1.1.5 | Brute Force Protection | Test rate limiting di `/auth/login` (10 req/15 menit) | 🔴 Critical |
| 1.1.6 | Refresh Token Reuse | Coba gunakan refresh token yang sudah di-rotate | 🔴 Critical |

### 1.2 Input Validation & Injection
| # | Test | Deskripsi | Prioritas |
|---|---|---|---|
| 1.2.1 | SQL Injection | Test semua input user dengan payload SQL injection | 🔴 Critical |
| 1.2.2 | XSS | Test input form dengan `<script>alert(1)</script>` | 🔴 Critical |
| 1.2.3 | Path Traversal | Test file upload dengan `../../../etc/passwd` | 🔴 Critical |
| 1.2.4 | File Upload Validation | Test upload file non-image (exe, php, js) | 🔴 Critical |
| 1.2.5 | File Size Limit | Test upload file > 5MB | 🟡 Medium |
| 1.2.6 | MIME Type Spoofing | Test upload file .exe dengan header image/jpeg | 🟡 Medium |

### 1.3 API Security
| # | Test | Deskripsi | Prioritas |
|---|---|---|---|
| 1.3.1 | CORS Misconfiguration | Test cross-origin requests dari domain tidak dikenal | 🟡 Medium |
| 1.3.2 | Missing Auth Headers | Test endpoint protected tanpa Authorization header | 🔴 Critical |
| 1.3.3 | IDOR | Coba akses loan/trustee user lain dengan mengganti ID | 🔴 Critical |
| 1.3.4 | Rate Limit Bypass | Test bypass rate limiting | 🟡 Medium |

### 1.4 Data Protection
| # | Test | Deskripsi | Prioritas |
|---|---|---|---|
| 1.4.1 | Sensitive Data Exposure | Cek response API tidak expose password_hash | 🔴 Critical |
| 1.4.2 | Environment Variable Leak | Cek `.env` tidak terekspos di client-side | 🔴 Critical |
| 1.4.3 | Secure Headers | Test security headers (X-Frame-Options, CSP) | 🟡 Medium |

---

## 2. 🐛 Bug Check & Fixing

### 2.1 Core Features
| # | Test | Deskripsi | Expected |
|---|---|---|---|
| 2.1.1 | Register → Login | Register user baru, login, verify JWT | User bisa login |
| 2.1.2 | Loan CRUD | Create, Read, Update, Delete loan | Semua operasi berhasil |
| 2.1.3 | Installment Creation | Verify installments generated saat loan activated | Jumlah = durationMonths |
| 2.1.4 | Payment Proof Upload | Upload bukti transfer, verify status pending | File tersimpan |
| 2.1.5 | Payment Proof Verify | Lender verify/reject proof | Status update |
| 2.1.6 | Loan Completion | Semua cicilan paid → status = completed | Auto-complete |
| 2.1.7 | Doa Lunas | Borrower kirim doa setelah lunas | Message tersimpan |
| 2.1.8 | Lender Rating | Borrower rate lender setelah completed | Rating tersimpan |

### 2.2 Edge Cases
| # | Test | Deskripsi | Expected |
|---|---|---|---|
| 2.2.1 | Zero Amount | Test create loan dengan amount = 0 | Error validation |
| 2.2.2 | Negative Duration | Test durationMonths < 1 | Error validation |
| 2.2.3 | Duplicate Email | Register dengan email sudah ada | Error 409 |
| 2.2.4 | Invalid UUID | Test endpoint dengan UUID tidak valid | Error 400/404 |
| 2.2.5 | Empty Request Body | POST tanpa body | Error 400 |
| 2.2.6 | Timezone Issues | Test due date calculation | Date konsisten |

### 2.3 State Transitions
| # | Test | Deskripsi | Valid |
|---|---|---|---|
| 2.3.1 | Loan Flow | pending → approved → active → completed | ✅ |
| 2.3.2 | Invalid Transitions | pending → completed (skip) | ❌ Error |
| 2.3.3 | Collateral | pending → held → verified → returned | ✅ |
| 2.3.4 | Payment Proof | pending → verified/rejected → re-upload | ✅ |

---

## 3. 🔍 Exploratory Testing

### 3.1 User Journey
| Role | Journey | Steps |
|---|---|---|
| Lender | End-to-end lifecycle | Register → Create loan → Approve → Activate → Verify → Complete |
| Borrower | Apply → Pay → Complete | Register → Profile → BI → Apply → Upload → Doa → Rate |
| Trustee | Accept → Hold → Return | Register → Accept → Verify → Return |
| Admin | Review → Manage | Login → Review users → Review loans → Audit |

### 3.2 Cross-Role Testing
| # | Test | Deskripsi |
|---|---|---|
| 3.2.1 | Role Switching | User request role change, admin approve |
| 3.2.2 | Permission Escalation | Coba akses fitur role lain tanpa permission |

### 3.3 Real-World Scenarios
| # | Scenario | Deskripsi |
|---|---|---|
| 3.3.1 | Late Payment | Installment due date passed, test reminder |
| 3.3.2 | Rejected Proof | Borrower upload → reject → re-upload |
| 3.3.3 | Loan Default | Lender mark as defaulted, verify tier impact |
| 3.3.4 | Multiple Loans | Borrower with 2 active loans, verify tier limits |

---

## 4. ⚡ Performance Testing

### 4.1 API Performance
| # | Test | Target |
|---|---|---|
| 4.1.1 | Response Time | < 200ms untuk GET endpoints |
| 4.1.2 | Concurrent Users | 100 concurrent, < 1s response |
| 4.1.3 | Database Queries | < 50ms per query, no N+1 |
| 4.1.4 | File Upload | < 2s untuk 5MB image |

### 4.2 Frontend Performance
| # | Test | Target |
|---|---|---|
| 4.2.1 | First Contentful Paint | < 1.5s |
| 4.2.2 | Time to Interactive | < 3s |
| 4.2.3 | Bundle Size | < 500KB initial |
| 4.2.4 | Memory Usage | < 100MB |

---

## 5. 🧩 Integration Testing

### 5.1 API Integration
| # | Test | Deskripsi |
|---|---|---|
| 5.1.1 | Auth → Protected | Login → use token → access protected route |
| 5.1.2 | Loan → Installments | Create loan → verify installments auto-generated |
| 5.1.3 | Installment → Proof | Upload proof → verify → mark paid |
| 5.1.4 | Payment → Completion | All paid → verify loan status = completed |
| 5.1.5 | Completion → Doa | Loan completed → borrower can send doa |
| 5.1.6 | Completion → Rating | Loan completed → borrower can rate lender |

### 5.2 External Services
| # | Test | Deskripsi |
|---|---|---|
| 5.2.1 | Email Delivery | Test Resend API integration |
| 5.2.2 | PDF Generation | Test contract PDF creation |
| 5.2.3 | File Storage | Test upload → download → delete |
| 5.2.4 | Cron Jobs | Test reminder cron, auto-delete cron |

---

## 6. 🎨 UI/UX Testing

### 6.1 Responsive Design
| Device | Breakpoint | Test |
|---|---|---|
| Mobile | 320px - 480px | All pages usable, no horizontal scroll |
| Tablet | 768px - 1024px | Layout adapts, touch targets adequate |
| Desktop | 1280px+ | Sidebar layout, full features visible |

### 6.2 Accessibility
| # | Test | Deskripsi |
|---|---|---|
| 6.2.1 | Keyboard Navigation | Tab through all interactive elements |
| 6.2.2 | Screen Reader | aria-labels on all buttons, forms |
| 6.2.3 | Color Contrast | WCAG AA compliance |
| 6.2.4 | Focus States | Visible focus rings |

### 6.3 Dark Mode
| # | Test | Deskripsi |
|---|---|---|
| 6.3.1 | Toggle | Dark mode toggle works, persists |
| 6.3.2 | All Pages | Every page renders correctly |
| 6.3.3 | Contrast | Text readable on dark backgrounds |

---

## 7. 📊 Data Integrity Testing

### 7.1 Database Constraints
| # | Test | Deskripsi |
|---|---|---|
| 7.1.1 | Foreign Keys | Delete user → cascade to related data |
| 7.1.2 | Unique Constraints | Duplicate email, loan_code, token |
| 7.1.3 | NOT NULL | Insert null into required fields |
| 7.1.4 | Enum Validation | Insert invalid enum value |

### 7.2 Data Consistency
| # | Test | Deskripsi |
|---|---|---|
| 7.2.1 | Tier Calculation | Verify tier updates after loan completion |
| 7.2.2 | Rating Average | Verify avg rating = sum/count |
| 7.2.3 | Installment Sum | Verify sum = loan.amount |
| 7.2.4 | Fee Calculation | Verify ujrah + stamp + admin + custody = totalFee |

---

## 8. 🚀 Deployment Testing

### 8.1 Docker Testing
| # | Test | Deskripsi |
|---|---|---|
| 8.1.1 | docker-compose up | All services start, health checks pass |
| 8.1.2 | Volume Persistence | Restart container → data persists |
| 8.1.3 | Environment Variables | All required env vars set |
| 8.1.4 | Network Isolation | Services communicate via defined networks |

### 8.2 Production Readiness
| # | Test | Deskripsi |
|---|---|---|
| 8.2.1 | HTTPS | SSL certificate valid |
| 8.2.2 | Error Pages | Custom 404, 500 pages |
| 8.2.3 | Logging | Application logs structured |
| 8.2.4 | Backup/Restore | Database backup → restore cycle |

---

## 🛠 Tools Recommended

| Category | Tool | Purpose |
|---|---|---|
| API Testing | Postman / Insomnia | Manual API testing |
| Load Testing | k6 / Artillery | Performance testing |
| Security | OWASP ZAP | Vulnerability scanning |
| Linting | ESLint, TypeScript | Code quality |
| E2E Testing | Playwright / Cypress | Browser automation |
| Unit Testing | Vitest (already setup) | Component/function tests |
| Accessibility | axe DevTools | A11y audit |
| Performance | Lighthouse | Web vitals |
