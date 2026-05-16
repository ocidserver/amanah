import { db } from "./db"
import { users, loans, installments, trustees, completionMessages, paymentProofs, lenderRatings } from "./db/schema"
import { hashPassword } from "./lib/auth"

const SEED_PASSWORD = "Password123!"

async function seed() {
  console.log("🌱 Seeding database...")

  let passwordHash: string
  try {
    passwordHash = await hashPassword(SEED_PASSWORD)
  } catch (err) {
    console.error("Failed to hash password:", err)
    process.exit(1)
  }

  // Create users
  console.log("  Creating users...")

  const [lender, borrower1, borrower2, admin, trusteeUser] = await db
    .insert(users)
    .values([
      {
        email: "lender@amanah.app",
        passwordHash,
        role: "lender",
        displayName: "Ahmad Fauzi",
        phone: "081234567890",
        lenderTier: "penolong",
        rating: "4.50",
        ratingCount: 2,
        profileCompleted: true,
        isVerified: true,
      },
      {
        email: "borrower1@amanah.app",
        passwordHash,
        role: "borrower",
        displayName: "Siti Aminah",
        phone: "081234567891",
        idNumber: "3201234567890001",
        address: "Jl. Merdeka No. 10, Bandung",
        occupation: "Pedagang",
        borrowerTier: "kecil",
        profileCompleted: true,
        isVerified: true,
      },
      {
        email: "borrower2@amanah.app",
        passwordHash,
        role: "borrower",
        displayName: "Budi Santoso",
        phone: "081234567892",
        idNumber: "3201234567890002",
        address: "Jl. Sudirman No. 25, Jakarta",
        occupation: "Buruh Pabrik",
        borrowerTier: "baru",
        profileCompleted: true,
        isVerified: true,
      },
      {
        email: "admin@amanah.app",
        passwordHash,
        role: "admin",
        displayName: "Admin Amanah",
        phone: "081234567899",
        profileCompleted: true,
        isVerified: true,
      },
      {
        email: "trustee@amanah.app",
        passwordHash,
        role: "trustee",
        displayName: "Haji Karim",
        phone: "081234567893",
        profileCompleted: true,
        isVerified: true,
      },
    ])
    .returning()

  console.log(`    ✓ Lender: ${lender.email}`)
  console.log(`    ✓ Borrower 1: ${borrower1.email}`)
  console.log(`    ✓ Borrower 2: ${borrower2.email}`)
  console.log(`    ✓ Admin: ${admin.email}`)
  console.log(`    ✓ Trustee: ${trusteeUser.email}`)

  // Create trustee
  console.log("  Creating trustee...")

  const [trustee] = await db
    .insert(trustees)
    .values({
      profileId: trusteeUser.id,
      name: "Haji Karim — Wali Amanah",
      type: "personal",
      email: "trustee@amanah.app",
      isVerified: true,
      createdBy: lender.id,
    })
    .returning()

  console.log(`    ✓ Trustee: ${trustee.name}`)

  // Create loans
  console.log("  Creating loans...")

  const now = new Date()
  const startDate = new Date(now)
  startDate.setMonth(startDate.getMonth() - 2)

  const [loan1, loan2, loan3] = await db
    .insert(loans)
    .values([
      {
        lenderId: lender.id,
        borrowerId: borrower1.id,
        borrowerAlias: "Ibu Siti — Toko Kelontong",
        trusteeId: trustee.id,
        amount: 3000000,
        durationMonths: 6,
        installmentType: "monthly",
        purpose: "business_capital",
        collateralType: "document",
        collateralStatus: "held",
        status: "active",
        hideBorrower: false,
        reminderEnabled: true,
        doaLunasEnabled: true,
        ujrah: 30000,
        stampFee: 10000,
        adminFee: 25000,
        custodyFee: 15000,
        totalFee: 80000,
        disbursedAmount: 2920000,
        startDate: startDate.toISOString().split("T")[0],
        dueDate: new Date(startDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        lenderId: lender.id,
        borrowerId: borrower2.id,
        borrowerAlias: "Pak Budi — Biaya Sekolah",
        trusteeId: null,
        amount: 1500000,
        durationMonths: 3,
        installmentType: "monthly",
        purpose: "education",
        collateralType: "none",
        collateralStatus: "pending",
        status: "completed",
        hideBorrower: false,
        reminderEnabled: true,
        doaLunasEnabled: true,
        ujrah: 15000,
        stampFee: 10000,
        adminFee: 25000,
        custodyFee: 0,
        totalFee: 50000,
        disbursedAmount: 1450000,
        startDate: new Date(now.getTime() - 4 * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        dueDate: new Date(now.getTime() - 1 * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        completedAt: new Date(now.getTime() - 1 * 30 * 24 * 60 * 60 * 1000),
      },
      {
        lenderId: lender.id,
        borrowerId: borrower1.id,
        borrowerAlias: "Ibu Siti — Modal Tambahan",
        trusteeId: trustee.id,
        amount: 5000000,
        durationMonths: 12,
        installmentType: "monthly",
        purpose: "business_capital",
        collateralType: "valuables",
        collateralStatus: "held",
        status: "pending",
        hideBorrower: false,
        reminderEnabled: true,
        doaLunasEnabled: true,
        ujrah: 50000,
        stampFee: 10000,
        adminFee: 25000,
        custodyFee: 25000,
        totalFee: 110000,
        disbursedAmount: 4890000,
      },
    ])
    .returning()

  console.log(`    ✓ Loan 1: ${loan1.borrowerAlias} — Rp 3.000.000 (active)`)
  console.log(`    ✓ Loan 2: ${loan2.borrowerAlias} — Rp 1.500.000 (completed)`)
  console.log(`    ✓ Loan 3: ${loan3.borrowerAlias} — Rp 5.000.000 (pending)`)

  // Create installments for loan 1 (active, 4 paid out of 6)
  console.log("  Creating installments...")

  const loan1Installments = []
  for (let i = 0; i < 6; i++) {
    const dueDate = new Date(startDate)
    dueDate.setMonth(dueDate.getMonth() + i)
    const isPaid = i < 4
    loan1Installments.push({
      loanId: loan1.id,
      periodLabel: `Cicilan ${i + 1}/6`,
      amount: 500000,
      dueDate: dueDate.toISOString().split("T")[0],
      status: isPaid ? "paid" as const : "unpaid" as const,
      paidAt: isPaid ? dueDate : null,
      confirmedBy: isPaid ? "lender" : null,
    })
  }

  const loan2Installments = []
  for (let i = 0; i < 3; i++) {
    const dueDate = new Date(now.getTime() - (3 - i) * 30 * 24 * 60 * 60 * 1000)
    loan2Installments.push({
      loanId: loan2.id,
      periodLabel: `Cicilan ${i + 1}/3`,
      amount: 500000,
      dueDate: dueDate.toISOString().split("T")[0],
      status: "paid" as const,
      paidAt: dueDate,
      confirmedBy: "lender",
    })
  }

  const loan3Installments = []
  for (let i = 0; i < 12; i++) {
    const dueDate = new Date(now)
    dueDate.setMonth(dueDate.getMonth() + i)
    loan3Installments.push({
      loanId: loan3.id,
      periodLabel: `Cicilan ${i + 1}/12`,
      amount: 416667,
      dueDate: dueDate.toISOString().split("T")[0],
      status: "unpaid" as const,
    })
  }

  await db.insert(installments).values([...loan1Installments, ...loan2Installments, ...loan3Installments])

  console.log(`    ✓ Loan 1: 6 installments (4 paid, 2 unpaid)`)
  console.log(`    ✓ Loan 2: 3 installments (all paid)`)
  console.log(`    ✓ Loan 3: 12 installments (all unpaid)`)

  // Create completion message for completed loan
  console.log("  Creating completion message...")

  await db.insert(completionMessages).values({
    loanId: loan2.id,
    message: "Alhamdulillah, pinjaman sudah lunas. Semoga Allah membalas kebaikan Bapak Ahmad. Semoga Amanah semakin berkah dan bisa membantu lebih banyak orang.",
  })

  console.log("    ✓ Doa lunas for Loan 2")

  // Create lender rating for completed loan
  console.log("  Creating lender rating...")

  await db.insert(lenderRatings).values({
    loanId: loan2.id,
    borrowerId: borrower2.id,
    lenderId: lender.id,
    rating: 5,
    review: "Pemberi pinjaman yang sangat baik dan amanah. Proses cepat dan transparan.",
  })

  console.log("    ✓ Rating 5/5 for Loan 2")

  console.log("\n✅ Seed completed!")
  console.log("\n📋 Login credentials:")
  console.log(`  Lender:    lender@amanah.app / ${SEED_PASSWORD}`)
  console.log(`  Borrower:  borrower1@amanah.app / ${SEED_PASSWORD}`)
  console.log(`  Borrower:  borrower2@amanah.app / ${SEED_PASSWORD}`)
  console.log(`  Admin:     admin@amanah.app / ${SEED_PASSWORD}`)
  console.log(`  Trustee:   trustee@amanah.app / ${SEED_PASSWORD}`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
