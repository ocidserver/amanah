import { db } from "./db"
import { users, trustees, loans, installments, biChecks } from "./db/schema"
import { hashPassword } from "./lib/auth"

const PASSWORD = "Password123!"

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split("T")[0]
}

async function seedFullCycle() {
  const passwordHash = await hashPassword(PASSWORD)

  console.log("🌱 Seeding full loan cycle...\n")

  // 1. Create borrower
  const [borrower] = await db
    .insert(users)
    .values({
      email: "ahmad.borrower@test.com",
      displayName: "Ahmad Fauzi",
      passwordHash,
      role: "borrower",
      phone: "081234567890",
      idNumber: "3201234567890123",
      address: "Jl. Merdeka No. 10, Jakarta Selatan",
      occupation: "Pedagang",
      profileCompleted: true,
      isVerified: true,
      borrowerTier: "kecil",
    })
    .returning({ id: users.id })
  console.log(`✅ Borrower: ahmad.borrower@test.com (${borrower.id})`)

  // 2. BI check approved for borrower
  await db
    .insert(biChecks)
    .values({
      userId: borrower.id,
      status: "approved",
      notes: "Tidak ada catatan negatif",
      checkedAt: new Date(),
    })
  console.log("✅ BI Check: approved")

  // 3. Create lender
  const [lender] = await db
    .insert(users)
    .values({
      email: "siti.lender@test.com",
      displayName: "Siti Rahayu",
      passwordHash,
      role: "lender",
      phone: "081234567891",
      idNumber: "3201234567890124",
      address: "Jl. Sudirman No. 5, Jakarta Pusat",
      occupation: "Wiraswasta",
      profileCompleted: true,
      isVerified: true,
      lenderTier: "penolong",
    })
    .returning({ id: users.id })
  console.log(`✅ Lender: siti.lender@test.com (${lender.id})`)

  // 4. Create trustee
  const [trustee] = await db
    .insert(users)
    .values({
      email: "budi.trustee@test.com",
      displayName: "Budi Santoso",
      passwordHash,
      role: "trustee",
      phone: "081234567892",
      idNumber: "3201234567890125",
      address: "Jl. Gatot Subroto No. 20, Jakarta Selatan",
      occupation: "Pegawai Negeri",
      profileCompleted: true,
      isVerified: true,
    })
    .returning({ id: users.id })
  console.log(`✅ Trustee user: budi.trustee@test.com (${trustee.id})`)

  const [trusteeProfile] = await db
    .insert(trustees)
    .values({
      profileId: trustee.id,
      name: "Budi Santoso",
      type: "personal",
      email: "budi.trustee@test.com",
      isVerified: true,
      createdBy: lender.id,
    })
    .returning({ id: trustees.id })
  console.log(`✅ Trustee profile created (${trusteeProfile.id})`)

  // 5. Create admin
  await db
    .insert(users)
    .values({
      email: "admin@amanah.test",
      displayName: "Admin Amanah",
      passwordHash,
      role: "admin",
      profileCompleted: true,
      isVerified: true,
    })
    .catch(() => console.log("⏭️  Admin already exists"))
  console.log("✅ Admin: admin@amanah.test")

  // 6. Create loan with collateral (document - sertifikat rumah)
  const amount = 5_000_000
  const ujrah = Math.max(Math.ceil(amount * 0.01), 10_000) // 50,000
  const stampFee = 10_000
  const adminFee = 25_000
  const custodyFee = Math.max(Math.ceil(amount * 0.005), 5_000) // 25,000
  const totalFee = ujrah + stampFee + adminFee + custodyFee // 110,000
  const disbursedAmount = amount - totalFee // 4,890,000

  const [loan] = await db
    .insert(loans)
    .values({
      lenderId: lender.id,
      borrowerId: borrower.id,
      borrowerAlias: "Ahmad F.",
      trusteeId: trusteeProfile.id,
      amount,
      durationMonths: 12,
      installmentType: "monthly",
      purpose: "business_capital",
      collateralType: "document",
      collateralDescription: "Sertifikat Rumah No. 1234/2020, SHM, Jl. Merdeka No. 10, Jakarta Selatan, Luas 120m²",
      collateralStatus: "verified",
      status: "active",
      ujrah,
      stampFee,
      adminFee,
      custodyFee,
      totalFee,
      disbursedAmount,
      transitAccount: "BCA 1234567890 a.n. Ahmad Fauzi",
      approvedBy: lender.id,
      approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      startDate: daysAgo(30),
      dueDate: daysFromNow(330),
    })
    .returning({ id: loans.id })
  console.log(`✅ Loan created: ${loan.id}`)
  console.log(`   Amount: Rp ${amount.toLocaleString("id-ID")}`)
  console.log(`   Collateral: Sertifikat Rumah (verified)`)
  console.log(`   Status: active`)

  // 7. Generate 12 monthly installments
  const installmentAmount = Math.ceil(amount / 12) // 416,667
  const installmentData = []

  for (let i = 0; i < 12; i++) {
    const dueDate = new Date()
    dueDate.setMonth(dueDate.getMonth() - 30 + i)

    let status: "unpaid" | "paid" = "unpaid"
    let paidAt: Date | null = null

    if (i < 3) {
      status = "paid"
      paidAt = new Date(dueDate.getTime() + 2 * 24 * 60 * 60 * 1000) // paid 2 days after due
    }

    installmentData.push({
      loanId: loan.id,
      periodLabel: `Bulan ${i + 1}`,
      amount: installmentAmount,
      dueDate: dueDate.toISOString().split("T")[0],
      status,
      paidAt,
      confirmedBy: status === "paid" ? "lender" : null,
    })
  }

  await db.insert(installments).values(installmentData)
  console.log(`✅ 12 installments created (3 paid, 9 unpaid)`)

  console.log("\n📋 Full Cycle Summary:")
  console.log("========================================")
  console.log("Borrower:  ahmad.borrower@test.com / Password123!")
  console.log("Lender:    siti.lender@test.com / Password123!")
  console.log("Trustee:   budi.trustee@test.com / Password123!")
  console.log("Admin:     admin@amanah.test / Password123!")
  console.log("========================================")
  console.log("Loan:      Rp 5,000,000 — Modal Usaha")
  console.log("Collateral: Sertifikat Rumah (verified)")
  console.log("Status:    Active (3/12 cicilan lunas)")
  console.log("========================================")

  process.exit(0)
}

seedFullCycle().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
