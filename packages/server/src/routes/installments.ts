import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { installments, loans, users } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"
import { checkAndCompleteLoan } from "../lib/loan-helpers"
import { sendPaymentConfirmedEmail } from "../lib/email"

const installmentRoutes = new Hono<AuthEnv>()

const confirmSchema = z.object({
  status: z.enum(["paid", "processing"]),
  confirmedBy: z.enum(["lender", "borrower"]),
})

installmentRoutes.get("/loan/:loanId", authMiddleware, async (c) => {
  const user = c.get("user")
  const loanId = c.req.param("loanId")!

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId))
  if (!loan || loan.lenderId !== user.userId) {
    return c.json({ error: "Loan not found" }, 404)
  }

  const loanInstallments = await db
    .select()
    .from(installments)
    .where(eq(installments.loanId, loanId))
    .orderBy(installments.dueDate)

  return c.json({ installments: loanInstallments })
})

installmentRoutes.patch("/:id/confirm", authMiddleware, zValidator("json", confirmSchema), async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!
  const body = c.req.valid("json")

  const [inst] = await db.select().from(installments).where(eq(installments.id, id))
  if (!inst) {
    return c.json({ error: "Installment not found" }, 404)
  }

  const [loan] = await db.select().from(loans).where(eq(loans.id, inst.loanId))
  if (!loan || loan.lenderId !== user.userId) {
    return c.json({ error: "Unauthorized" }, 403)
  }

  const updateData: Record<string, unknown> = {
    status: body.status,
    confirmedBy: body.confirmedBy,
  }
  if (body.status === "paid") {
    updateData.paidAt = new Date()
  }

  const [updated] = await db
    .update(installments)
    .set(updateData)
    .where(eq(installments.id, id))
    .returning()

  if (body.status === "paid") {
    checkAndCompleteLoan(inst.loanId).catch(() => {})

    const [loan] = await db.select().from(loans).where(eq(loans.id, inst.loanId))
    if (loan) {
      if (loan.lenderId) {
        const [lenderUser] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, loan.lenderId))
        if (lenderUser?.email) {
          sendPaymentConfirmedEmail(lenderUser.email, inst.periodLabel, inst.amount).catch(() => {})
        }
      }
      if (loan.borrowerId) {
        const [borrowerUser] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, loan.borrowerId))
        if (borrowerUser?.email) {
          sendPaymentConfirmedEmail(borrowerUser.email, inst.periodLabel, inst.amount).catch(() => {})
        }
      }
    }
  }

  return c.json({ installment: updated })
})

export default installmentRoutes