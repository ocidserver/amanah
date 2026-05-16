import { eq } from "drizzle-orm"
import { db } from "../db"
import { loans, installments, users } from "../db/schema"
import { updateBorrowerTier, updateLenderTier } from "./tiers"
import { sendLoanCompletedEmail } from "./email"

export async function checkAndCompleteLoan(loanId: string): Promise<boolean> {
  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId))
  if (!loan || loan.status !== "active") return false

  const allInstallments = await db
    .select()
    .from(installments)
    .where(eq(installments.loanId, loanId))

  if (allInstallments.length === 0) return false

  const allPaid = allInstallments.every((inst) => inst.status === "paid")
  if (!allPaid) return false

  await db
    .update(loans)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(loans.id, loanId))

  if (loan.borrowerId) {
    updateBorrowerTier(loan.borrowerId).catch(() => {})
  }
  if (loan.lenderId) {
    updateLenderTier(loan.lenderId).catch(() => {})
  }

  if (loan.lenderId) {
    const [lender] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, loan.lenderId))
    if (lender?.email) {
      sendLoanCompletedEmail(lender.email, loan.borrowerAlias, loan.amount, loan.loanCode || loan.id).catch(() => {})
    }
  }

  if (loan.borrowerId) {
    const [borrower] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, loan.borrowerId))
    if (borrower?.email) {
      sendLoanCompletedEmail(borrower.email, loan.borrowerAlias, loan.amount, loan.loanCode || loan.id).catch(() => {})
    }
  }

  return true
}