import { Hono } from "hono"
import { eq, and, desc } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { loans, installments, completionMessages, lenderRatings, users } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"
import { borrowerOnlyMiddleware } from "../middleware/role"
import { checkAndCompleteLoan } from "../lib/loan-helpers"
import { sendPaymentConfirmedEmail } from "../lib/email"

const borrowerRoutes = new Hono<AuthEnv>()

borrowerRoutes.use("/*", authMiddleware, borrowerOnlyMiddleware)

borrowerRoutes.get("/loans", async (c) => {
  const user = c.get("user")

  const allLoans = await db
    .select()
    .from(loans)
    .where(eq(loans.borrowerId, user.userId))
    .orderBy(desc(loans.createdAt))

  return c.json({ loans: allLoans })
})

borrowerRoutes.get("/loans/:id", async (c) => {
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

  const lender = loan.lenderId
    ? (await db
        .select({ id: users.id, displayName: users.displayName, lenderTier: users.lenderTier, rating: users.rating })
        .from(users)
        .where(eq(users.id, loan.lenderId)))[0] ?? null
    : null

  const [msg] = await db
    .select()
    .from(completionMessages)
    .where(eq(completionMessages.loanId, id))
    .catch(() => [])

  const [rating] = await db
    .select()
    .from(lenderRatings)
    .where(eq(lenderRatings.loanId, id))
    .catch(() => [])

  return c.json({
    loan,
    installments: loanInstallments,
    lender: lender ?? null,
    completionMessage: msg ?? null,
    lenderRating: rating ?? null,
  })
})

borrowerRoutes.patch("/installments/:id/confirm", zValidator("json", z.object({
  status: z.enum(["paid", "processing"]),
})), async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!
  const { status } = c.req.valid("json")

  const [inst] = await db.select().from(installments).where(eq(installments.id, id))
  if (!inst) {
    return c.json({ error: "Cicilan tidak ditemukan" }, 404)
  }

  const [loan] = await db.select().from(loans).where(and(eq(loans.id, inst.loanId), eq(loans.borrowerId, user.userId)))
  if (!loan) {
    return c.json({ error: "Tidak memiliki akses" }, 403)
  }

  const updateData: Record<string, unknown> = {
    status,
    confirmedBy: "borrower",
  }
  if (status === "paid") {
    updateData.paidAt = new Date()
  }

  const [updated] = await db
    .update(installments)
    .set(updateData)
    .where(eq(installments.id, id))
    .returning()

  if (status === "paid") {
    checkAndCompleteLoan(inst.loanId).catch(() => {})

    const [loan] = await db.select().from(loans).where(and(eq(loans.id, inst.loanId), eq(loans.borrowerId, user.userId)))
    if (loan) {
      if (loan.lenderId) {
        const [lenderUser] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, loan.lenderId))
        if (lenderUser?.email) {
          sendPaymentConfirmedEmail(lenderUser.email, inst.periodLabel, inst.amount).catch(() => {})
        }
      }
      const [borrowerUser] = await db.select({ email: users.email }).from(users).where(eq(users.id, user.userId))
      if (borrowerUser?.email) {
        sendPaymentConfirmedEmail(borrowerUser.email, inst.periodLabel, inst.amount).catch(() => {})
      }
    }
  }

  return c.json({ installment: updated })
})

borrowerRoutes.post("/completion-messages/loan/:loanId", zValidator("json", z.object({
  message: z.string().min(1).max(500),
})), async (c) => {
  const user = c.get("user")
  const loanId = c.req.param("loanId")!
  const { message } = c.req.valid("json")

  const [loan] = await db.select().from(loans).where(and(eq(loans.id, loanId), eq(loans.borrowerId, user.userId)))
  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  if (!loan.doaLunasEnabled) {
    return c.json({ error: "Doa lunas tidak diaktifkan untuk pinjaman ini" }, 400)
  }

  const existing = await db.select().from(completionMessages).where(eq(completionMessages.loanId, loanId))
  if (existing.length > 0) {
    return c.json({ error: "Doa lunas sudah ada untuk pinjaman ini" }, 409)
  }

  const [newMsg] = await db
    .insert(completionMessages)
    .values({ loanId, message })
    .returning()

  return c.json({ message: newMsg }, 201)
})

borrowerRoutes.post("/rate-lender", zValidator("json", z.object({
  loanId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().optional(),
})), async (c) => {
  const user = c.get("user")
  const { loanId, rating, review } = c.req.valid("json")

  const [loan] = await db.select().from(loans).where(and(eq(loans.id, loanId), eq(loans.borrowerId, user.userId)))
  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  const allInstallments = await db.select().from(installments).where(eq(installments.loanId, loanId))
  const allPaid = allInstallments.length > 0 && allInstallments.every((i) => i.status === "paid")

  if (loan.status !== "completed" && !allPaid) {
    return c.json({ error: "Hanya bisa memberi rating untuk pinjaman yang sudah lunas" }, 400)
  }

  const [existing] = await db.select().from(lenderRatings).where(eq(lenderRatings.loanId, loanId))
  if (existing) {
    return c.json({ error: "Rating sudah diberikan untuk pinjaman ini" }, 409)
  }

  if (!loan.lenderId) {
    return c.json({ error: "Pinjaman belum memiliki pemberi pinjaman" }, 400)
  }

  const [newRating] = await db
    .insert(lenderRatings)
    .values({
      loanId,
      borrowerId: user.userId,
      lenderId: loan.lenderId,
      rating,
      review: review ?? null,
    })
    .returning()

  const allRatings = await db.select().from(lenderRatings).where(eq(lenderRatings.lenderId, loan.lenderId))
  const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length

  await db
    .update(users)
    .set({
      rating: avgRating.toFixed(2),
      ratingCount: allRatings.length,
    })
    .where(eq(users.id, loan.lenderId))

  return c.json({ rating: newRating }, 201)
})

borrowerRoutes.get("/profile", async (c) => {
  const user = c.get("user")

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.userId))
  if (!dbUser) {
    return c.json({ error: "User not found" }, 404)
  }

  const activeLoans = await db.select().from(loans).where(and(eq(loans.borrowerId, user.userId), eq(loans.status, "active")))
  const completedLoans = await db.select().from(loans).where(and(eq(loans.borrowerId, user.userId), eq(loans.status, "completed")))
  const pendingLoans = await db.select().from(loans).where(and(eq(loans.borrowerId, user.userId), eq(loans.status, "pending")))
  const approvedLoans = await db.select().from(loans).where(and(eq(loans.borrowerId, user.userId), eq(loans.status, "approved")))
  const totalActive = activeLoans.reduce((s, l) => s + l.amount, 0)
  const totalCompleted = completedLoans.reduce((s, l) => s + l.amount, 0)

  return c.json({
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    displayName: dbUser.displayName,
    phone: dbUser.phone,
    idNumber: dbUser.idNumber,
    address: dbUser.address,
    occupation: dbUser.occupation,
    ktpDocumentUrl: dbUser.ktpDocumentUrl,
    profileCompleted: dbUser.profileCompleted,
    borrowerTier: dbUser.borrowerTier,
    onTimePercentage: dbUser.onTimePercentage,
    completedLoans: dbUser.completedLoans,
    activeLoansCount: activeLoans.length,
    completedLoansCount: completedLoans.length,
    pendingLoansCount: pendingLoans.length,
    approvedLoansCount: approvedLoans.length,
    totalActive,
    totalCompleted,
    createdAt: dbUser.createdAt,
  })
})

borrowerRoutes.get("/credit-score", async (c) => {
  const user = c.get("user")

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.userId))
  if (!dbUser) {
    return c.json({ error: "User not found" }, 404)
  }

  const allLoans = await db.select().from(loans).where(eq(loans.borrowerId, user.userId))
  const completedLoans = allLoans.filter((l) => l.status === "completed")
  const activeLoans = allLoans.filter((l) => l.status === "active")

  const totalBorrowed = allLoans.reduce((s, l) => s + l.amount, 0)
  const totalRepaid = completedLoans.reduce((s, l) => s + l.amount, 0)

  const allInstallments = await db
    .select({ status: installments.status, paidAt: installments.paidAt, dueDate: installments.dueDate })
    .from(installments)
    .innerJoin(loans, eq(installments.loanId, loans.id))
    .where(eq(loans.borrowerId, user.userId))

  const totalInstallments = allInstallments.length
  let onTimeCount = 0
  for (const inst of allInstallments) {
    if (inst.status === "paid" && inst.paidAt) {
      const dueDate = new Date(inst.dueDate)
      const paidDate = new Date(inst.paidAt)
      const diffDays = (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays <= 7) onTimeCount++
    }
  }
  const onTimePct = totalInstallments > 0 ? Math.round((onTimeCount / totalInstallments) * 100) : 0

  const currentTier = dbUser.borrowerTier ?? "baru"
  const tierOrder: { key: string; label: string; maxAmount: number; requiredLoans: number; requiredOnTime: number }[] = [
    { key: "baru", label: "Peminjam Baru", maxAmount: 2000000, requiredLoans: 0, requiredOnTime: 0 },
    { key: "kecil", label: "Peminjam Kecil", maxAmount: 5000000, requiredLoans: 1, requiredOnTime: 80 },
    { key: "menengah", label: "Peminjam Menengah", maxAmount: 15000000, requiredLoans: 3, requiredOnTime: 85 },
    { key: "utama", label: "Peminjam Utama", maxAmount: 50000000, requiredLoans: 5, requiredOnTime: 90 },
  ]

  const currentIndex = tierOrder.findIndex((t) => t.key === currentTier)
  const nextTier = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null

  const tierProgress = nextTier
    ? {
        current: currentTier,
        next: nextTier.key,
        nextLabel: nextTier.label,
        maxAmount: nextTier.maxAmount,
        loansNeeded: Math.max(0, nextTier.requiredLoans - completedLoans.length),
        onTimeNeeded: Math.max(0, nextTier.requiredOnTime - onTimePct),
        progressPct: Math.min(100, Math.round(((completedLoans.length / nextTier.requiredLoans) * 50 + (onTimePct / nextTier.requiredOnTime) * 50))),
      }
    : { current: currentTier, next: null, nextLabel: "Tier Tertinggi", maxAmount: 50000000, loansNeeded: 0, onTimeNeeded: 0, progressPct: 100 }

  return c.json({
    currentTier,
    currentTierLabel: tierOrder[currentIndex]?.label || "Peminjam Baru",
    maxBorrowingAmount: tierOrder[currentIndex]?.maxAmount || 2000000,
    totalBorrowed,
    totalRepaid,
    completedLoansCount: completedLoans.length,
    activeLoansCount: activeLoans.length,
    onTimePercentage: onTimePct,
    totalInstallments,
    onTimeInstallments: onTimeCount,
    tierProgress,
    allTiers: tierOrder.map((t, i) => ({
      key: t.key,
      label: t.label,
      maxAmount: t.maxAmount,
      isCurrent: i === currentIndex,
      isCompleted: i < currentIndex,
    })),
  })
})

export default borrowerRoutes