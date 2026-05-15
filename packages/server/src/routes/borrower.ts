import { Hono } from "hono"
import { eq, and, desc } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { loans, installments, completionMessages, lenderRatings, users } from "../db/schema"
import { authMiddleware,AuthEnv } from "../middleware/auth"
import { borrowerOnlyMiddleware } from "../middleware/role"

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

  const [lender] = await db
    .select({ id: users.id, displayName: users.displayName, lenderTier: users.lenderTier, rating: users.rating })
    .from(users)
    .where(eq(users.id, loan.lenderId))

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

  if (loan.status !== "completed") {
    return c.json({ error: "Hanya bisa memberi rating untuk pinjaman yang sudah lunas" }, 400)
  }

  const [existing] = await db.select().from(lenderRatings).where(eq(lenderRatings.loanId, loanId))
  if (existing) {
    return c.json({ error: "Rating sudah diberikan untuk pinjaman ini" }, 409)
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
  const totalActive = activeLoans.reduce((s, l) => s + l.amount, 0)
  const totalCompleted = completedLoans.reduce((s, l) => s + l.amount, 0)

  return c.json({
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    displayName: dbUser.displayName,
    borrowerTier: dbUser.borrowerTier,
    onTimePercentage: dbUser.onTimePercentage,
    completedLoans: dbUser.completedLoans,
    activeLoansCount: activeLoans.length,
    completedLoansCount: completedLoans.length,
    totalActive,
    totalCompleted,
    createdAt: dbUser.createdAt,
  })
})

export default borrowerRoutes