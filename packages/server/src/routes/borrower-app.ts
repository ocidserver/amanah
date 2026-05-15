import { Hono } from "hono"
import { eq, and, desc, sql } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { loans, installments, users, biChecks } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"
import { borrowerOnlyMiddleware } from "../middleware/role"
import { calculateFees } from "../lib/fees"
import { checkBorrowingLimit } from "../lib/tiers"

const app = new Hono<AuthEnv>()

const applyLoanSchema = z.object({
  amount: z.number().int().positive(),
  durationMonths: z.number().int().min(1).max(60),
  installmentType: z.enum(["monthly", "weekly", "lump_sum", "flexible"]).default("monthly"),
  purpose: z.enum(["business_capital", "home", "consumables", "education", "health", "urgent_needs", "family_needs", "debt_consolidation"]),
  collateralType: z.enum(["document", "valuables", "letter", "none"]).default("none"),
  applicationNote: z.string().max(1000).optional(),
  reminderEnabled: z.boolean().default(true),
  doaLunasEnabled: z.boolean().default(true),
})

app.use("/*", authMiddleware, borrowerOnlyMiddleware)

app.get("/bi-check", async (c) => {
  const user = c.get("user")

  const [lastCheck] = await db
    .select()
    .from(biChecks)
    .where(eq(biChecks.userId, user.userId))
    .orderBy(desc(biChecks.createdAt))
    .limit(1)

  return c.json({ biCheck: lastCheck ?? null })
})

app.post("/bi-check", async (c) => {
  const user = c.get("user")

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.userId))

  if (!existing?.profileCompleted) {
    return c.json({ error: "Lengkapi profil terlebih dahulu sebelum pengecekan BI" }, 400)
  }

  const rand = Math.random()
  let status: "approved" | "rejected" | "review" = "approved"
  let notes = "Pengecekan BI selesai. Tidak ditemukan masalah."
  if (rand > 0.9) {
    status = "rejected"
    notes = "Ditemukan indikasi blacklist. Silakan hubungi BMT untuk informasi lebih lanjut."
  } else if (rand > 0.8) {
    status = "review"
    notes = "Ditemukan catatan yang memerlukan review manual. Tim BMT akan menghubungi Anda."
  }

  const [biCheck] = await db
    .insert(biChecks)
    .values({
      userId: user.userId,
      status,
      notes,
      checkedAt: new Date(),
    })
    .returning()

  return c.json({ biCheck }, 201)
})

app.get("/can-apply", async (c) => {
  const user = c.get("user")

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.userId))
  if (!dbUser) {
    return c.json({ canApply: false, reason: "Profil tidak ditemukan" })
  }

  if (!dbUser.profileCompleted) {
    return c.json({ canApply: false, reason: "Lengkapi profil terlebih dahulu" })
  }

  const [lastCheck] = await db
    .select()
    .from(biChecks)
    .where(eq(biChecks.userId, user.userId))
    .orderBy(desc(biChecks.createdAt))
    .limit(1)

  if (!lastCheck || lastCheck.status !== "approved") {
    return c.json({ canApply: false, reason: "Lakukan pengecekan BI terlebih dahulu dan pastikan hasilnya disetujui" })
  }

  const pendingLoans = await db
    .select()
    .from(loans)
    .where(and(eq(loans.borrowerId, user.userId), eq(loans.status, "pending")))

  if (pendingLoans.length >= 3) {
    return c.json({ canApply: false, reason: "Anda sudah memiliki 3 pengajuan yang menunggu persetujuan" })
  }

  const { maxAmount } = await checkBorrowingLimit(user.userId, 0)

  return c.json({ canApply: true, maxBorrowingAmount: maxAmount, borrowerTier: dbUser.borrowerTier })
})

app.post("/loans/apply", zValidator("json", applyLoanSchema), async (c) => {
  const user = c.get("user")
  const body = c.req.valid("json")

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.userId))
  if (!dbUser?.profileCompleted) {
    return c.json({ error: "Lengkapi profil terlebih dahulu" }, 400)
  }

  const [lastCheck] = await db
    .select()
    .from(biChecks)
    .where(eq(biChecks.userId, user.userId))
    .orderBy(desc(biChecks.createdAt))
    .limit(1)

  if (!lastCheck || lastCheck.status !== "approved") {
    return c.json({ error: "BI checking belum disetujui" }, 400)
  }

  const pendingLoans = await db
    .select()
    .from(loans)
    .where(and(eq(loans.borrowerId, user.userId), eq(loans.status, "pending")))

  if (pendingLoans.length >= 3) {
    return c.json({ error: "Maksimum 3 pengajuan menunggu persetujuan" }, 400)
  }

  const { allowed, maxAmount } = await checkBorrowingLimit(user.userId, body.amount)
  if (!allowed) {
    return c.json({ error: `Batas pinjaman untuk tier Anda adalah Rp ${maxAmount.toLocaleString("id-ID")}` }, 400)
  }

  const fees = calculateFees(body.amount)

  const [newLoan] = await db
    .insert(loans)
    .values({
      borrowerId: user.userId,
      borrowerAlias: dbUser.displayName || "Peminjam",
      amount: body.amount,
      durationMonths: body.durationMonths,
      installmentType: body.installmentType,
      purpose: body.purpose,
      collateralType: body.collateralType,
      collateralStatus: "pending",
      applicationNote: body.applicationNote ?? null,
      status: "pending",
      reminderEnabled: body.reminderEnabled,
      doaLunasEnabled: body.doaLunasEnabled,
      ujrah: fees.ujrah,
      stampFee: fees.stampFee,
      adminFee: fees.adminFee,
      custodyFee: fees.custodyFee,
      totalFee: fees.totalFee,
      disbursedAmount: fees.disbursedAmount,
    })
    .returning()

  return c.json({ loan: newLoan, fees }, 201)
})

app.get("/loans", async (c) => {
  const user = c.get("user")

  const allLoans = await db
    .select()
    .from(loans)
    .where(eq(loans.borrowerId, user.userId))
    .orderBy(desc(loans.createdAt))

  return c.json({ loans: allLoans })
})

app.get("/loans/:id", async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!

  const [loan] = await db
    .select()
    .from(loans)
    .where(and(eq(loans.id, id), eq(loans.borrowerId, user.userId)))

  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  const loanInstallments = await db
    .select()
    .from(installments)
    .where(eq(installments.loanId, id))
    .orderBy(installments.dueDate)

  let lender = null
  if (loan.lenderId) {
    const [l] = await db
      .select({ id: users.id, displayName: users.displayName, lenderTier: users.lenderTier, rating: users.rating })
      .from(users)
      .where(eq(users.id, loan.lenderId))
    lender = l ?? null
  }

  return c.json({ loan, installments: loanInstallments, lender })
})

app.get("/fees-preview", zValidator("query", z.object({
  amount: z.string().transform(Number).pipe(z.number().int().positive()),
})), async (c) => {
  const amount = c.req.valid("query").amount
  const fees = calculateFees(amount)
  return c.json({ fees })
})

export default app