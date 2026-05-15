import { eq, and, isNull, inArray, lt, not } from "drizzle-orm"
import { db } from "../db"
import { installments, loans, users } from "../db/schema"
import { sendPaymentReminderEmail, sendBorrowerReminderEmail } from "../lib/email"
import fs from "fs"
import path from "path"

export async function runReminderCron(): Promise<{ message: string; count: number }> {
  const now = new Date()
  const h3Date = new Date(now)
  h3Date.setDate(h3Date.getDate() + 3)
  const h0Date = new Date(now)
  h0Date.setDate(h0Date.getDate() + 0)

  const h3Str = h3Date.toISOString().split("T")[0]
  const h0Str = h0Date.toISOString().split("T")[0]

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

  let count = 0

  for (const inst of dueInstallments) {
    const type = inst.dueDate === h3Str ? "H-3" : "H-0"
    const daysLeft = inst.dueDate === h3Str ? 3 : 0

    const [loan] = await db.select().from(loans).where(eq(loans.id, inst.loanId))
    if (!loan) continue

    let borrowerEmail: string | null = null
    if (loan.borrowerId) {
      const [borrowerUser] = await db
        .select({ email: users.email, displayName: users.displayName })
        .from(users)
        .where(eq(users.id, loan.borrowerId))
      borrowerEmail = borrowerUser?.email ?? null
    }

    let lenderEmail: string | null = null
    if (loan.lenderId) {
      const [lenderUser] = await db
        .select({ email: users.email, displayName: users.displayName })
        .from(users)
        .where(eq(users.id, loan.lenderId))
      lenderEmail = lenderUser?.email ?? null
    }

    if (borrowerEmail) {
      sendBorrowerReminderEmail(borrowerEmail, loan.borrowerAlias, inst.amount, inst.periodLabel, inst.dueDate, daysLeft).catch(() => {})
    }
    if (lenderEmail) {
      sendPaymentReminderEmail(lenderEmail, loan.borrowerAlias, inst.amount, inst.periodLabel, inst.dueDate).catch(() => {})
    }

    await db
      .update(installments)
      .set({ reminderSentAt: new Date() })
      .where(eq(installments.id, inst.id))

    count++
  }

  return { message: `Reminders sent for ${count} installments`, count }
}

export async function runAutoDeleteCron(): Promise<{ message: string; count: number }> {
  const now = new Date()

  // Find completed loans with autoDeleteDays set
  const completedLoans = await db
    .select({
      id: loans.id,
      status: loans.status,
      completedAt: loans.completedAt,
      autoDeleteDays: loans.autoDeleteDays,
    })
    .from(loans)
    .where(
      and(
        eq(loans.status, "completed"),
        not(isNull(loans.autoDeleteDays))
      )
    )

  let count = 0

  for (const loan of completedLoans) {
    if (!loan.completedAt || !loan.autoDeleteDays) continue

    const deleteAfter = new Date(loan.completedAt)
    deleteAfter.setDate(deleteAfter.getDate() + loan.autoDeleteDays)

    if (now >= deleteAfter) {
      // Soft delete: mark as cancelled
      await db
        .update(loans)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(loans.id, loan.id))

      count++
    }
  }

  return { message: `Auto-deleted ${count} completed loans`, count }
}
