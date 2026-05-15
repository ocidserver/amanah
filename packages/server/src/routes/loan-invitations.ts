import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { loanInvitations, loans, users } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"

const invitationRoutes = new Hono<AuthEnv>()

invitationRoutes.get("/:token", async (c) => {
  const token = c.req.param("token")

  const [invitation] = await db.select().from(loanInvitations).where(eq(loanInvitations.token, token))

  if (!invitation) {
    return c.json({ error: "Undangan tidak ditemukan" }, 404)
  }

  if (invitation.status !== "pending") {
    return c.json({ error: `Undangan sudah ${invitation.status === "accepted" ? "diterima" : "kadaluarsa"}` }, 400)
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    await db.update(loanInvitations).set({ status: "expired" }).where(eq(loanInvitations.id, invitation.id))
    return c.json({ error: "Undangan sudah kadaluarsa" }, 400)
  }

  const [loan] = await db.select().from(loans).where(eq(loans.id, invitation.loanId))
  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  const lenderId = loan.lenderId
  const lender = lenderId
    ? (await db.select({
        displayName: users.displayName,
        email: users.email,
      }).from(users).where(eq(users.id, lenderId)))[0] ?? null
    : null

  const [borrower] = await db.select().from(users).where(eq(users.email, invitation.borrowerEmail))

  return c.json({
    invitation: {
      id: invitation.id,
      email: invitation.borrowerEmail,
      expiresAt: invitation.expiresAt,
    },
    loan: {
      amount: loan.amount,
      durationMonths: loan.durationMonths,
      purpose: loan.purpose,
      borrowerAlias: loan.borrowerAlias,
    },
    lender: lender ?? null,
    borrowerExists: !!borrower,
  })
})

invitationRoutes.post("/:token/accept", authMiddleware, zValidator("json", z.object({})), async (c) => {
  const user = c.get("user")
  const token = c.req.param("token")

  if (user.role !== "borrower") {
    return c.json({ error: "Hanya akun peminjam yang bisa menerima undangan" }, 403)
  }

  const [invitation] = await db.select().from(loanInvitations).where(eq(loanInvitations.token, token))

  if (!invitation) {
    return c.json({ error: "Undangan tidak ditemukan" }, 404)
  }

  if (invitation.status !== "pending") {
    return c.json({ error: `Undangan sudah ${invitation.status === "accepted" ? "diterima" : "kadaluarsa"}` }, 400)
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    await db.update(loanInvitations).set({ status: "expired" }).where(eq(loanInvitations.id, invitation.id))
    return c.json({ error: "Undangan sudah kadaluarsa" }, 400)
  }

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.userId))
  if (!dbUser || dbUser.email !== invitation.borrowerEmail) {
    return c.json({ error: "Email Anda tidak cocok dengan undangan ini" }, 403)
  }

  await db.update(loans).set({ borrowerId: user.userId }).where(eq(loans.id, invitation.loanId))
  await db.update(loanInvitations).set({ status: "accepted" }).where(eq(loanInvitations.id, invitation.id))

  const [loan] = await db.select().from(loans).where(eq(loans.id, invitation.loanId))

  return c.json({ message: "Undangan diterima", loanId: invitation.loanId })
})

export default invitationRoutes