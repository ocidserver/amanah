import { Hono } from "hono"
import { eq, and } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { installments, paymentProofs, loans, users } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"
import { checkAndCompleteLoan } from "../lib/loan-helpers"
import { sendPaymentConfirmedEmail } from "../lib/email"
import { serve } from "@hono/node-server"

const proofRoutes = new Hono<AuthEnv>()

proofRoutes.use("/*", authMiddleware)

proofRoutes.post("/installments/:id/upload", async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!

  const [inst] = await db.select().from(installments).where(eq(installments.id, id))
  if (!inst) {
    return c.json({ error: "Cicilan tidak ditemukan" }, 404)
  }

  const [loan] = await db.select().from(loans).where(eq(loans.id, inst.loanId))
  if (!loan || loan.borrowerId !== user.userId) {
    return c.json({ error: "Tidak memiliki akses" }, 403)
  }

  const [existing] = await db.select().from(paymentProofs).where(eq(paymentProofs.installmentId, id)).catch(() => [])
  if (existing) {
    return c.json({ error: "Bukti transfer sudah diupload untuk cicilan ini" }, 409)
  }

  const formData = await c.req.parseBody()
  const file = formData["image"]

  if (!file || typeof file === "string") {
    return c.json({ error: "File gambar wajib diupload" }, 400)
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Format file harus JPG, PNG, atau WebP" }, 400)
  }

  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "Ukuran file maksimal 5MB" }, 400)
  }

  const filename = `proof-${id}-${Date.now()}.${file.name.split(".").pop() || "jpg"}`
  const imageUrl = `/uploads/proofs/${filename}`

  const [proof] = await db
    .insert(paymentProofs)
    .values({
      installmentId: id,
      imageUrl,
      status: "pending",
    })
    .returning()

  return c.json({ proof }, 201)
})

proofRoutes.get("/installments/:id", async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!

  const [inst] = await db.select().from(installments).where(eq(installments.id, id))
  if (!inst) {
    return c.json({ error: "Cicilan tidak ditemukan" }, 404)
  }

  const [proof] = await db.select().from(paymentProofs).where(eq(paymentProofs.installmentId, id)).catch(() => [])
  if (!proof) {
    return c.json({ proof: null })
  }

  return c.json({ proof })
})

proofRoutes.patch("/:id/verify", zValidator("json", z.object({
  status: z.enum(["verified", "rejected"]),
})), async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!
  const { status } = c.req.valid("json")

  const [proof] = await db.select().from(paymentProofs).where(eq(paymentProofs.id, id))
  if (!proof) {
    return c.json({ error: "Bukti transfer tidak ditemukan" }, 404)
  }

  const [inst] = await db.select().from(installments).where(eq(installments.id, proof.installmentId))
  if (!inst) {
    return c.json({ error: "Cicilan tidak ditemukan" }, 404)
  }

  const [loan] = await db.select().from(loans).where(eq(loans.id, inst.loanId))
  if (!loan || (loan.lenderId && loan.lenderId !== user.userId)) {
    return c.json({ error: "Tidak memiliki akses" }, 403)
  }

  if (proof.status !== "pending") {
    return c.json({ error: "Bukti transfer sudah diverifikasi" }, 400)
  }

  await db
    .update(paymentProofs)
    .set({ status, verifiedBy: user.userId, verifiedAt: new Date() })
    .where(eq(paymentProofs.id, id))

  if (status === "verified") {
    await db
      .update(installments)
      .set({ status: "paid", paidAt: new Date(), confirmedBy: "lender" })
      .where(eq(installments.id, proof.installmentId))

    checkAndCompleteLoan(inst.loanId).catch(() => {})

    const [instLoan] = await db.select().from(loans).where(eq(loans.id, inst.loanId))
    if (instLoan) {
      if (instLoan.lenderId) {
        const [lenderUser] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, instLoan.lenderId))
        if (lenderUser?.email) {
          sendPaymentConfirmedEmail(lenderUser.email, inst.periodLabel, inst.amount).catch(() => {})
        }
      }
      if (instLoan.borrowerId) {
        const [borrowerUser] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, instLoan.borrowerId))
        if (borrowerUser?.email) {
          sendPaymentConfirmedEmail(borrowerUser.email, inst.periodLabel, inst.amount).catch(() => {})
        }
      }
    }
  }

  const [updated] = await db.select().from(paymentProofs).where(eq(paymentProofs.id, id))
  return c.json({ proof: updated })
})

export default proofRoutes