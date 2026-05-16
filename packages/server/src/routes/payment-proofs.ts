import { Hono } from "hono"
import { eq, and } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { installments, paymentProofs, loans, users } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"
import { checkAndCompleteLoan } from "../lib/loan-helpers"
import { sendPaymentConfirmedEmail, sendPaymentRejectedEmail } from "../lib/email"
import { sendPushNotification } from "../lib/push"
import { validateFile, validateFileContent, saveFile, deleteFile } from "../lib/storage"

const proofRoutes = new Hono<AuthEnv>()

proofRoutes.use("/*", authMiddleware)

// GET /payment-proofs - Get all payment proofs for lender's loans (with optional status filter)
proofRoutes.get("/", async (c) => {
  const user = c.get("user")
  const status = c.req.query("status") as "pending" | "verified" | "rejected" | undefined

  const whereClause = status
    ? and(eq(paymentProofs.status, status), eq(loans.lenderId, user.userId))
    : eq(loans.lenderId, user.userId)

  const allProofs = await db
    .select({
      id: paymentProofs.id,
      installmentId: paymentProofs.installmentId,
      imageUrl: paymentProofs.imageUrl,
      status: paymentProofs.status,
      uploadedAt: paymentProofs.uploadedAt,
      verifiedAt: paymentProofs.verifiedAt,
      installment: {
        id: installments.id,
        periodLabel: installments.periodLabel,
        amount: installments.amount,
        dueDate: installments.dueDate,
        status: installments.status,
      },
      loan: {
        id: loans.id,
        loanCode: loans.id,
        borrowerAlias: loans.borrowerAlias,
        lenderId: loans.lenderId,
      },
    })
    .from(paymentProofs)
    .innerJoin(installments, eq(paymentProofs.installmentId, installments.id))
    .innerJoin(loans, eq(installments.loanId, loans.id))
    .where(whereClause)
    .orderBy(paymentProofs.uploadedAt)

  return c.json({ proofs: allProofs, count: allProofs.length })
})

// GET /payment-proofs/pending - Get pending payment proofs for lender's loans
proofRoutes.get("/pending", async (c) => {
  const user = c.get("user")

  const pendingProofs = await db
    .select({
      id: paymentProofs.id,
      installmentId: paymentProofs.installmentId,
      imageUrl: paymentProofs.imageUrl,
      status: paymentProofs.status,
      uploadedAt: paymentProofs.uploadedAt,
      installment: {
        id: installments.id,
        periodLabel: installments.periodLabel,
        amount: installments.amount,
        dueDate: installments.dueDate,
        status: installments.status,
      },
      loan: {
        id: loans.id,
        loanCode: loans.id,
        borrowerAlias: loans.borrowerAlias,
        lenderId: loans.lenderId,
      },
    })
    .from(paymentProofs)
    .innerJoin(installments, eq(paymentProofs.installmentId, installments.id))
    .innerJoin(loans, eq(installments.loanId, loans.id))
    .where(and(eq(paymentProofs.status, "pending"), eq(loans.lenderId, user.userId)))
    .orderBy(paymentProofs.uploadedAt)

  return c.json({ pendingProofs, count: pendingProofs.length })
})

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
  if (existing && existing.status !== "rejected") {
    return c.json({ error: "Bukti transfer sudah diupload untuk cicilan ini" }, 409)
  }

  const formData = await c.req.parseBody()
  const file = formData["image"]

  if (!file || typeof file === "string") {
    return c.json({ error: "File gambar wajib diupload" }, 400)
  }

  const validation = validateFile("proofs", file)
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400)
  }

  const contentValidation = await validateFileContent(file)
  if (!contentValidation.valid) {
    return c.json({ error: contentValidation.error }, 400)
  }

  const imageUrl = await saveFile("proofs", file, `proof-${id}`)

  if (existing && existing.status === "rejected") {
    await deleteFile(existing.imageUrl)
    const [updatedProof] = await db
      .update(paymentProofs)
      .set({ imageUrl, status: "pending", verifiedBy: null, verifiedAt: null })
      .where(eq(paymentProofs.id, existing.id))
      .returning()
    return c.json({ proof: updatedProof }, 201)
  }

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
        sendPushNotification(instLoan.lenderId, {
          title: "Pembayaran Dikonfirmasi",
          body: `Cicilan ${inst.periodLabel} telah dikonfirmasi lunas.`,
          icon: "/icons/icon-192.png",
          tag: `payment-verified-${inst.id}`,
          data: { url: `/pinjaman/${instLoan.id}` },
        }).catch(() => {})
      }
      if (instLoan.borrowerId) {
        const [borrowerUser] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, instLoan.borrowerId))
        if (borrowerUser?.email) {
          sendPaymentConfirmedEmail(borrowerUser.email, inst.periodLabel, inst.amount).catch(() => {})
        }
        sendPushNotification(instLoan.borrowerId, {
          title: "Pembayaran Dikonfirmasi",
          body: `Cicilan ${inst.periodLabel} Anda telah dikonfirmasi lunas.`,
          icon: "/icons/icon-192.png",
          tag: `payment-confirmed-${inst.id}`,
          data: { url: `/borrower/loans/${instLoan.id}` },
        }).catch(() => {})
      }
    }
  } else if (status === "rejected") {
    const [instLoan] = await db.select().from(loans).where(eq(loans.id, inst.loanId))
    if (instLoan?.borrowerId) {
      const [borrowerUser] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, instLoan.borrowerId))
      if (borrowerUser?.email) {
        sendPaymentRejectedEmail(borrowerUser.email, inst.periodLabel, inst.amount).catch(() => {})
      }
      sendPushNotification(instLoan.borrowerId, {
        title: "Bukti Transfer Ditolak",
        body: `Bukti transfer untuk cicilan ${inst.periodLabel} ditolak. Silakan upload ulang.`,
        icon: "/icons/icon-192.png",
        tag: `payment-rejected-${inst.id}`,
        data: { url: `/borrower/loans/${instLoan.id}` },
      }).catch(() => {})
    }
  }

  const [updated] = await db.select().from(paymentProofs).where(eq(paymentProofs.id, id))
  return c.json({ proof: updated })
})

export default proofRoutes