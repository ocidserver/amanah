import { Hono } from "hono"
import { eq, and, desc } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { loans, installments, users, loanInvitations, trusteeRequests } from "../db/schema"
import { generateInvitationToken } from "../lib/utils"
import { authMiddleware, AuthEnv } from "../middleware/auth"
import { lenderOnlyMiddleware } from "../middleware/role"
import { checkBorrowingLimit } from "../lib/tiers"
import { sendLoanInvitationEmail, sendLoanCreatedEmail } from "../lib/email"

const loanRoutes = new Hono<AuthEnv>()

const createLoanSchema = z.object({
  borrowerAlias: z.string().default("Peminjam"),
  amount: z.number().int().positive(),
  durationMonths: z.number().int().positive(),
  installmentType: z.enum(["monthly", "weekly", "lump_sum", "flexible"]).default("monthly"),
  purpose: z.enum(["business_capital", "home", "consumables", "education", "health", "urgent_needs", "family_needs", "debt_consolidation"]).default("urgent_needs"),
  collateralType: z.enum(["document", "valuables", "letter", "none"]).default("none"),
  trusteeId: z.string().uuid().optional(),
  borrowerEmail: z.string().email().optional(),
  notesEncrypted: z.string().optional(),
  hideBorrower: z.boolean().default(false),
  reminderEnabled: z.boolean().default(true),
  doaLunasEnabled: z.boolean().default(true),
})

loanRoutes.use("/", authMiddleware, lenderOnlyMiddleware)

loanRoutes.get("/", async (c) => {
  const user = c.get("user")
  const allLoans = await db
    .select()
    .from(loans)
    .where(eq(loans.lenderId, user.userId))
    .orderBy(desc(loans.createdAt))

  return c.json({ loans: allLoans })
})

loanRoutes.post("/", zValidator("json", createLoanSchema), async (c) => {
  const user = c.get("user")
  const body = c.req.valid("json")

  let borrowerId: string | null = null

  if (body.borrowerEmail) {
    const [borrower] = await db.select().from(users).where(eq(users.email, body.borrowerEmail.toLowerCase()))
    if (borrower) {
      if (borrower.role !== "borrower") {
        return c.json({ error: "Email tersebut bukan akun peminjam" }, 400)
      }

      const { allowed, maxAmount, tier } = await checkBorrowingLimit(borrower.id, body.amount)
      if (!allowed) {
        return c.json({
          error: `Batas pinjaman untuk tier ${tier === "utama" ? "Peminjam Utama" : tier === "menengah" ? "Peminjam Menengah" : tier === "kecil" ? "Peminjam Kecil" : "Peminjam Baru"} adalah Rp ${maxAmount.toLocaleString("id-ID")}`,
        }, 400)
      }

      borrowerId = borrower.id
    }
  }

  const [newLoan] = await db
    .insert(loans)
    .values({
      lenderId: user.userId,
      borrowerId,
      borrowerAlias: body.borrowerAlias,
      amount: body.amount,
      durationMonths: body.durationMonths,
      installmentType: body.installmentType,
      purpose: body.purpose,
      collateralType: body.collateralType,
      trusteeId: body.trusteeId ?? null,
      notesEncrypted: body.notesEncrypted ?? null,
      hideBorrower: body.hideBorrower,
      reminderEnabled: body.reminderEnabled,
      doaLunasEnabled: body.doaLunasEnabled,
    })
    .returning()

  if (body.installmentType !== "lump_sum" && body.installmentType !== "flexible") {
const installmentAmount = Math.ceil(body.amount / body.durationMonths)
  const startDate = newLoan.startDate ? new Date(newLoan.startDate) : new Date()
  for (let i = 0; i < body.durationMonths; i++) {
    const dueDate = new Date(startDate)
      if (body.installmentType === "monthly") {
        dueDate.setMonth(dueDate.getMonth() + i + 1)
      } else {
        dueDate.setDate(dueDate.getDate() + (i + 1) * 7)
      }
      const label = body.installmentType === "monthly"
        ? `${dueDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`
        : `Minggu ${i + 1}`
      await db.insert(installments).values({
        loanId: newLoan.id,
        periodLabel: label,
        amount: i === body.durationMonths - 1
          ? body.amount - installmentAmount * (body.durationMonths - 1)
          : installmentAmount,
        dueDate: dueDate.toISOString().split("T")[0],
      })
    }
  }

  if (body.borrowerEmail && !borrowerId) {
    const invitationToken = generateInvitationToken()

    await db.insert(loanInvitations).values({
      loanId: newLoan.id,
      borrowerEmail: body.borrowerEmail.toLowerCase(),
      token: invitationToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    const [lenderUser] = await db.select({ displayName: users.displayName, email: users.email }).from(users).where(eq(users.id, user.userId))

    await sendLoanInvitationEmail(
      body.borrowerEmail.toLowerCase(),
      body.borrowerAlias,
      body.amount,
      lenderUser?.displayName || lenderUser?.email || "Pemberi Pinjaman",
      invitationToken
    ).catch(() => {})
  }

  const [lenderUser] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, user.userId))

  sendLoanCreatedEmail(
    lenderUser?.email ?? "",
    newLoan.borrowerAlias,
    newLoan.amount,
    newLoan.id
  ).catch(() => {})

  if (body.trusteeId && body.collateralType !== "none") {
    await db.insert(trusteeRequests).values({
      loanId: newLoan.id,
      trusteeId: body.trusteeId,
      status: "pending",
    })
  }

  const freshLoan = await db.select().from(loans).where(eq(loans.id, newLoan.id))
  const loanInstallments = await db.select().from(installments).where(eq(installments.loanId, newLoan.id)).orderBy(installments.dueDate)

  const invitationSent = !!(body.borrowerEmail && !borrowerId)

  return c.json({ loan: freshLoan[0], installments: loanInstallments, invitationSent }, 201)
})

loanRoutes.get("/:id", async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!

  const [loan] = await db
    .select()
    .from(loans)
    .where(and(eq(loans.id, id), eq(loans.lenderId, user.userId)))

  if (!loan) {
    return c.json({ error: "Loan not found" }, 404)
  }

  const loanInstallments = await db
    .select()
    .from(installments)
    .where(eq(installments.loanId, id))
    .orderBy(installments.dueDate)

  const borrower = loan.borrowerId
    ? await db.select({ id: users.id, displayName: users.displayName, email: users.email, borrowerTier: users.borrowerTier }).from(users).where(eq(users.id, loan.borrowerId)).then(r => r[0] ?? null)
    : null

  return c.json({ loan, installments: loanInstallments, borrower })
})

loanRoutes.get("/search-borrower", authMiddleware, lenderOnlyMiddleware, async (c) => {
  const email = c.req.query("email")
  if (!email) {
    return c.json({ error: "Email required" }, 400)
  }

  const [borrower] = await db.select({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    borrowerTier: users.borrowerTier,
    role: users.role,
  }).from(users).where(eq(users.email, email.toLowerCase()))

  if (!borrower || borrower.role !== "borrower") {
    return c.json({ borrower: null })
  }

  const { getMaxBorrowingAmount } = await import("../lib/tiers")
  const maxAmount = getMaxBorrowingAmount(borrower.borrowerTier as any)

  return c.json({
    borrower: {
      id: borrower.id,
      email: borrower.email,
      displayName: borrower.displayName,
      borrowerTier: borrower.borrowerTier,
      maxBorrowingAmount: maxAmount,
    }
  })
})

const updateStatusSchema = z.object({
  status: z.enum(["cancelled", "defaulted", "active", "approved", "rejected"]),
})

loanRoutes.patch("/:id/status", authMiddleware, lenderOnlyMiddleware, zValidator("json", updateStatusSchema), async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!
  const { status } = c.req.valid("json")

  const [loan] = await db.select().from(loans).where(and(eq(loans.id, id), eq(loans.lenderId, user.userId)))
  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  if (status === "cancelled") {
    if (loan.status !== "active" && loan.status !== "approved" && loan.status !== "pending") {
      return c.json({ error: "Hanya pinjaman aktif, disetujui, atau menunggu yang bisa dibatalkan" }, 400)
    }
  } else if (status === "defaulted") {
    if (loan.status !== "active") {
      return c.json({ error: "Hanya pinjaman aktif yang bisa ditandai gagal bayar" }, 400)
    }
  } else if (status === "active") {
    if (loan.status !== "approved") {
      return c.json({ error: "Hanya pinjaman yang disetujui yang bisa diaktifkan" }, 400)
    }
  }

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() }
  if (status === "active" && !loan.startDate) {
    updateData.startDate = new Date().toISOString().split("T")[0]
  }

  await db.update(loans).set(updateData).where(eq(loans.id, id))

  if (status === "cancelled") {
    await db.update(installments)
      .set({ status: "unpaid" })
      .where(and(eq(installments.loanId, id), eq(installments.status, "unpaid")))
  }

  const [updatedLoan] = await db.select().from(loans).where(eq(loans.id, id))

  return c.json({ loan: updatedLoan })
})

export default loanRoutes