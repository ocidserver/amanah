import { Hono } from "hono"
import { eq, and, lte, gte, isNull, inArray } from "drizzle-orm"
import { db } from "../db"
import { installments, loans, users } from "../db/schema"
import { sendPaymentReminderEmail, sendBorrowerReminderEmail } from "../lib/email"

const reminderRoutes = new Hono()

// POST /reminders/cron
// Triggered by cron job to send H-3 and H-0 reminders
reminderRoutes.post("/cron", async (c) => {
  // Optional: simple auth via header to prevent abuse
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = c.req.header("Authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return c.json({ error: "Unauthorized" }, 401)
    }
  }

  const now = new Date()
  const h3Date = new Date(now)
  h3Date.setDate(h3Date.getDate() + 3)
  const h0Date = new Date(now)
  h0Date.setDate(h0Date.getDate() + 0)

  // Format dates to YYYY-MM-DD for comparison with date column
  const h3Str = h3Date.toISOString().split("T")[0]
  const h0Str = h0Date.toISOString().split("T")[0]

  // Find installments due in H-3 and H-0 that haven't had reminders sent
  const dueInstallments = await db
    .select({
      id: installments.id,
      loanId: installments.loanId,
      periodLabel: installments.periodLabel,
      amount: installments.amount,
      dueDate: installments.dueDate,
      reminderSentAt: installments.reminderSentAt,
      status: installments.status,
    })
    .from(installments)
    .where(
      and(
        inArray(installments.dueDate, [h3Str, h0Str]),
        isNull(installments.reminderSentAt),
        eq(installments.status, "unpaid")
      )
    )

  const results: { installmentId: string; type: "H-3" | "H-0"; borrowerEmail: string | null; lenderEmail: string | null }[] = []

  for (const inst of dueInstallments) {
    const type = inst.dueDate === h3Str ? "H-3" : "H-0"
    const daysLeft = inst.dueDate === h3Str ? 3 : 0

    // Get loan details
    const [loan] = await db.select().from(loans).where(eq(loans.id, inst.loanId))
    if (!loan) continue

    // Get borrower email
    let borrowerEmail: string | null = null
    if (loan.borrowerId) {
      const [borrowerUser] = await db
        .select({ email: users.email, displayName: users.displayName })
        .from(users)
        .where(eq(users.id, loan.borrowerId))
      borrowerEmail = borrowerUser?.email ?? null
    }

    // Get lender email
    let lenderEmail: string | null = null
    if (loan.lenderId) {
      const [lenderUser] = await db
        .select({ email: users.email, displayName: users.displayName })
        .from(users)
        .where(eq(users.id, loan.lenderId))
      lenderEmail = lenderUser?.email ?? null
    }

    // Send reminder emails
    if (borrowerEmail) {
      sendBorrowerReminderEmail(borrowerEmail, loan.borrowerAlias, inst.amount, inst.periodLabel, inst.dueDate, daysLeft).catch(() => {})
    }
    if (lenderEmail) {
      sendPaymentReminderEmail(lenderEmail, loan.borrowerAlias, inst.amount, inst.periodLabel, inst.dueDate).catch(() => {})
    }

    // Mark reminder as sent
    await db
      .update(installments)
      .set({ reminderSentAt: new Date() })
      .where(eq(installments.id, inst.id))

    results.push({
      installmentId: inst.id,
      type,
      borrowerEmail,
      lenderEmail,
    })
  }

  return c.json({
    message: `Reminders sent for ${results.length} installments`,
    results,
    timestamp: new Date().toISOString(),
  })
})

export default reminderRoutes
