import { db } from "../db"
import { eq, and, sql } from "drizzle-orm"
import { users, loans, installments } from "../db/schema"
import type { BorrowerTier, LenderTier } from "@amanah/shared"

const BORROWER_TIER_LIMITS: Record<BorrowerTier, number> = {
  baru: 2_000_000,
  kecil: 5_000_000,
  menengah: 15_000_000,
  utama: 50_000_000,
}

const DEFAULT_BORROWER_TIER: BorrowerTier = "baru"
const DEFAULT_LENDER_TIER: LenderTier = "pemula"

export function getMaxBorrowingAmount(tier: BorrowerTier | null): number {
  return BORROWER_TIER_LIMITS[tier ?? DEFAULT_BORROWER_TIER]
}

export function getTierName(tier: BorrowerTier | null): string {
  if (!tier) return "Peminjam Baru"
  const names: Record<BorrowerTier, string> = {
    baru: "Peminjam Baru",
    kecil: "Peminjam Kecil",
    menengah: "Peminjam Menengah",
    utama: "Peminjam Utama",
  }
  return names[tier]
}

export async function calculateBorrowerTier(borrowerId: string): Promise<BorrowerTier> {
  const completedLoansRows = await db
    .select()
    .from(loans)
    .where(and(eq(loans.borrowerId, borrowerId), eq(loans.status, "completed")))

  const completedLoans = completedLoansRows.length

  const allInstallments = await db
    .select({
      dueDate: installments.dueDate,
      paidAt: installments.paidAt,
      status: installments.status,
      loanId: installments.loanId,
    })
    .from(installments)
    .innerJoin(loans, eq(installments.loanId, loans.id))
    .where(and(eq(loans.borrowerId, borrowerId), eq(loans.status, "completed")))

  const totalInstallments = allInstallments.length
  let onTimeCount = 0

  if (totalInstallments > 0) {
    for (const inst of allInstallments) {
      if (inst.status === "paid" && inst.paidAt) {
        const dueDate = new Date(inst.dueDate)
        const paidDate = new Date(inst.paidAt)
        const diffDays = (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays <= 7) onTimeCount++
      }
    }
  }

  const onTimePercentage = totalInstallments > 0 ? (onTimeCount / totalInstallments) * 100 : 0

  await db
    .update(users)
    .set({
      completedLoans,
      onTimePercentage: onTimePercentage.toFixed(2),
    })
    .where(eq(users.id, borrowerId))

  if (completedLoans >= 5 && onTimePercentage >= 90) return "utama"
  if (completedLoans >= 3 && onTimePercentage >= 85) return "menengah"
  if (completedLoans >= 1 && onTimePercentage >= 80) return "kecil"
  return "baru"
}

export async function calculateLenderTier(lenderId: string): Promise<LenderTier> {
  const activeLoansRows = await db
    .select()
    .from(loans)
    .where(and(eq(loans.lenderId, lenderId), eq(loans.status, "active")))

  const activeLoans = activeLoansRows.length

  if (activeLoans >= 10) return "mujir"
  if (activeLoans >= 6) return "dermawan"
  if (activeLoans >= 3) return "penolong"
  return "pemula"
}

export async function updateBorrowerTier(borrowerId: string): Promise<void> {
  const tier = await calculateBorrowerTier(borrowerId)
  await db.update(users).set({ borrowerTier: tier }).where(eq(users.id, borrowerId))
}

export async function updateLenderTier(lenderId: string): Promise<void> {
  const tier = await calculateLenderTier(lenderId)
  await db.update(users).set({ lenderTier: tier }).where(eq(users.id, lenderId))
}

export async function checkBorrowingLimit(borrowerId: string, amount: number): Promise<{ allowed: boolean; maxAmount: number; tier: BorrowerTier }> {
  const [user] = await db.select({ borrowerTier: users.borrowerTier }).from(users).where(eq(users.id, borrowerId))
  const tier = (user?.borrowerTier as BorrowerTier) ?? DEFAULT_BORROWER_TIER
  const maxAmount = BORROWER_TIER_LIMITS[tier]
  return { allowed: amount <= maxAmount, maxAmount, tier }
}

export { BORROWER_TIER_LIMITS, DEFAULT_BORROWER_TIER, DEFAULT_LENDER_TIER }