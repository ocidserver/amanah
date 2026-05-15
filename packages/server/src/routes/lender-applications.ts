import { Hono } from "hono"
import { eq, and, desc, isNull } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { loans, installments, users, trustees, trusteeRequests } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"
import { lenderOnlyMiddleware } from "../middleware/role"
import { checkAndCompleteLoan } from "../lib/loan-helpers"
import { sendLoanCreatedEmail } from "../lib/email"
import { generateContractPdf } from "../lib/contract"

const app = new Hono<AuthEnv>()

app.use("/*", authMiddleware, lenderOnlyMiddleware)

app.get("/applications", async (c) => {
  const user = c.get("user")

  const approvedByMe = await db
    .select()
    .from(loans)
    .where(and(eq(loans.approvedBy, user.userId), desc(loans.createdAt)))
    .orderBy(desc(loans.createdAt))

  const pendingLoans = await db
    .select({
      id: loans.id,
      borrowerAlias: loans.borrowerAlias,
      amount: loans.amount,
      durationMonths: loans.durationMonths,
      purpose: loans.purpose,
      installmentType: loans.installmentType,
      collateralType: loans.collateralType,
      totalFee: loans.totalFee,
      disbursedAmount: loans.disbursedAmount,
      status: loans.status,
      applicationNote: loans.applicationNote,
      createdAt: loans.createdAt,
      borrowerId: loans.borrowerId,
    })
    .from(loans)
    .where(and(eq(loans.status, "pending"), isNull(loans.lenderId)))
    .orderBy(desc(loans.createdAt))

  const borrowerIds = [...new Set(pendingLoans.map((l) => l.borrowerId).filter(Boolean))]
  const borrowerMap = new Map<string, { id: string; displayName: string | null; email: string; borrowerTier: string | null; onTimePercentage: string | null; completedLoans: number }>()

  for (const bid of borrowerIds) {
    const [b] = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        borrowerTier: users.borrowerTier,
        onTimePercentage: users.onTimePercentage,
        completedLoans: users.completedLoans,
      })
      .from(users)
      .where(eq(users.id, bid!))
    if (b) borrowerMap.set(bid!, b)
  }

  const applications = pendingLoans.map((l) => ({
    ...l,
    borrower: l.borrowerId ? borrowerMap.get(l.borrowerId) ?? null : null,
  }))

  return c.json({ applications, myApprovedLoans: approvedByMe })
})

app.get("/applications/:id", async (c) => {
  const id = c.req.param("id")!

  const [loan] = await db.select().from(loans).where(eq(loans.id, id))
  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  if (loan.status !== "pending" && loan.approvedBy !== c.get("user").userId) {
    return c.json({ error: "Tidak memiliki akses" }, 403)
  }

  let borrower = null
  if (loan.borrowerId) {
    const [b] = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        borrowerTier: users.borrowerTier,
        onTimePercentage: users.onTimePercentage,
        completedLoans: users.completedLoans,
        phone: users.phone,
        occupation: users.occupation,
        address: users.address,
      })
      .from(users)
      .where(eq(users.id, loan.borrowerId))
    borrower = b ?? null
  }

  return c.json({ loan, borrower })
})

app.patch("/applications/:id/approve", async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!

  const [loan] = await db.select().from(loans).where(eq(loans.id, id))
  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  if (loan.status !== "pending") {
    return c.json({ error: "Hanya pengajuan dengan status menunggu yang bisa disetujui" }, 400)
  }

  if (loan.lenderId && loan.lenderId !== user.userId) {
    return c.json({ error: "Pengajuan ini sudah diklaim oleh pemberi pinjaman lain" }, 400)
  }

  if (loan.installmentType !== "lump_sum" && loan.installmentType !== "flexible") {
    const installmentAmount = Math.ceil(loan.amount / loan.durationMonths)
    const startDate = new Date()

    for (let i = 0; i < loan.durationMonths; i++) {
      const dueDate = new Date(startDate)
      if (loan.installmentType === "monthly") {
        dueDate.setMonth(dueDate.getMonth() + i + 1)
      } else {
        dueDate.setDate(dueDate.getDate() + (i + 1) * 7)
      }
      const label = loan.installmentType === "monthly"
        ? `${dueDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`
        : `Minggu ${i + 1}`
      await db.insert(installments).values({
        loanId: loan.id,
        periodLabel: label,
        amount: i === loan.durationMonths - 1
          ? loan.amount - installmentAmount * (loan.durationMonths - 1)
          : installmentAmount,
        dueDate: dueDate.toISOString().split("T")[0],
      })
    }
  }

  const [updated] = await db
    .update(loans)
    .set({
      lenderId: user.userId,
      approvedBy: user.userId,
      approvedAt: new Date(),
      status: "approved",
      startDate: new Date().toISOString().split("T")[0],
      updatedAt: new Date(),
    })
    .where(eq(loans.id, id))
    .returning()

  if (loan.borrowerId) {
    const [borrowerUser] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, loan.borrowerId))
    if (borrowerUser?.email) {
      sendLoanCreatedEmail(borrowerUser.email, loan.borrowerAlias, loan.amount, loan.id).catch(() => {})
    }
  }

  const [lenderUser] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, user.userId))
  if (lenderUser?.email) {
    sendLoanCreatedEmail(lenderUser.email, loan.borrowerAlias, loan.amount, loan.id).catch(() => {})
  }

  // Generate contract PDF
  try {
    const [trusteeData] = loan.trusteeId
      ? await db.select({ name: trustees.name }).from(trustees).where(eq(trustees.id, loan.trusteeId))
      : []

    const contractUrl = await generateContractPdf({
      loanId: loan.id,
      lenderName: lenderUser?.displayName || lenderUser?.email || "Pemberi Pinjaman",
      borrowerAlias: loan.borrowerAlias,
      amount: loan.amount,
      durationMonths: loan.durationMonths,
      installmentType: loan.installmentType,
      purpose: loan.purpose,
      collateralType: loan.collateralType,
      ujrah: loan.ujrah,
      stampFee: loan.stampFee,
      adminFee: loan.adminFee,
      custodyFee: loan.custodyFee,
      totalFee: loan.totalFee,
      disbursedAmount: loan.disbursedAmount,
      startDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + loan.durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      trusteeName: trusteeData?.name,
    })

    await db.update(loans).set({ contractUrl }).where(eq(loans.id, id))
  } catch (err) {
    console.error("Failed to generate contract:", err)
  }

  if (loan.trusteeId && loan.collateralType !== "none") {
    await db.insert(trusteeRequests).values({
      loanId: loan.id,
      trusteeId: loan.trusteeId,
      status: "pending",
    })

    const [trustee] = await db.select({ email: trustees.email, name: trustees.name }).from(trustees).where(eq(trustees.id, loan.trusteeId))
    if (trustee?.email) {
      const { sendTrusteeInvitationEmail } = await import("../lib/email")
      sendTrusteeInvitationEmail(trustee.email, lenderUser?.displayName || lenderUser?.email || "Pemberi Pinjaman", loan.id).catch(() => {})
    }
  }

  return c.json({ loan: updated })
})

app.patch("/applications/:id/reject", zValidator("json", z.object({
  reason: z.string().max(500).optional(),
})), async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!
  const { reason } = c.req.valid("json")

  const [loan] = await db.select().from(loans).where(eq(loans.id, id))
  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  if (loan.status !== "pending") {
    return c.json({ error: "Hanya pengajuan dengan status menunggu yang bisa ditolak" }, 400)
  }

  const [updated] = await db
    .update(loans)
    .set({
      lenderId: user.userId,
      status: "rejected",
      notesEncrypted: reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(loans.id, id))
    .returning()

  return c.json({ loan: updated })
})

app.post("/applications/:id/claim", async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!

  const [loan] = await db.select().from(loans).where(eq(loans.id, id))
  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  if (loan.status !== "pending") {
    return c.json({ error: "Hanya pengajuan dengan status menunggu yang bisa diklaim" }, 400)
  }

  if (loan.lenderId) {
    return c.json({ error: "Pengajuan ini sudah diklaim" }, 400)
  }

  const [updated] = await db
    .update(loans)
    .set({
      lenderId: user.userId,
      updatedAt: new Date(),
    })
    .where(eq(loans.id, id))
    .returning()

  return c.json({ loan: updated })
})

app.patch("/applications/:id/activate", async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!

  const [loan] = await db.select().from(loans).where(and(eq(loans.id, id), eq(loans.approvedBy, user.userId)))
  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  if (loan.status !== "approved") {
    return c.json({ error: "Hanya pinjaman yang sudah disetujui yang bisa diaktifkan" }, 400)
  }

  if (loan.collateralType !== "none" && loan.collateralStatus !== "held" && loan.collateralStatus !== "verified") {
    return c.json({ error: "Jaminan belum diverifikasi oleh wali amanah" }, 400)
  }

  const [updated] = await db
    .update(loans)
    .set({
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      updatedAt: new Date(),
    })
    .where(eq(loans.id, id))
    .returning()

  return c.json({ loan: updated })
})

export default app