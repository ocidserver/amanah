import { Hono } from "hono"
import { eq, and, desc } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { trustees, trusteeRequests, loans, users } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"

const trusteeAppRoutes = new Hono<AuthEnv>()

trusteeAppRoutes.use("/*", authMiddleware)

trusteeAppRoutes.get("/profile", async (c) => {
  const user = c.get("user")

  const trusteeRows = await db
    .select()
    .from(trustees)
    .where(eq(trustees.profileId, user.userId))

  if (trusteeRows.length === 0) {
    return c.json({ error: "Profil wali amanah tidak ditemukan" }, 404)
  }

  const trustee = trusteeRows[0]

  const [userRow] = await db
    .select({ isVerified: users.isVerified, displayName: users.displayName, email: users.email, phone: users.phone, idNumber: users.idNumber, ktpDocumentUrl: users.ktpDocumentUrl })
    .from(users)
    .where(eq(users.id, user.userId))

  const pendingRequests = await db
    .select({
      id: trusteeRequests.id,
      loanId: trusteeRequests.loanId,
      trusteeId: trusteeRequests.trusteeId,
      status: trusteeRequests.status,
      createdAt: trusteeRequests.createdAt,
      respondedAt: trusteeRequests.respondedAt,
      loan: {
        id: loans.id,
        amount: loans.amount,
        durationMonths: loans.durationMonths,
        purpose: loans.purpose,
        collateralType: loans.collateralType,
        collateralDescription: loans.collateralDescription,
        collateralStatus: loans.collateralStatus,
        status: loans.status,
        borrowerAlias: loans.borrowerAlias,
      },
    })
    .from(trusteeRequests)
    .innerJoin(loans, eq(trusteeRequests.loanId, loans.id))
    .where(and(eq(trusteeRequests.trusteeId, trustee.id), eq(trusteeRequests.status, "pending")))
    .orderBy(desc(trusteeRequests.createdAt))

  const heldCollateral = await db
    .select({
      id: trusteeRequests.id,
      loanId: trusteeRequests.loanId,
      status: trusteeRequests.status,
      loan: {
        id: loans.id,
        amount: loans.amount,
        durationMonths: loans.durationMonths,
        purpose: loans.purpose,
        collateralType: loans.collateralType,
        collateralDescription: loans.collateralDescription,
        collateralStatus: loans.collateralStatus,
        status: loans.status,
        borrowerAlias: loans.borrowerAlias,
      },
    })
    .from(trusteeRequests)
    .innerJoin(loans, eq(trusteeRequests.loanId, loans.id))
    .where(and(eq(trusteeRequests.trusteeId, trustee.id), eq(trusteeRequests.status, "accepted")))
    .orderBy(desc(trusteeRequests.createdAt))

  return c.json({
    trustee,
    user: userRow,
    pendingRequests,
    heldCollateral,
  })
})

trusteeAppRoutes.patch(
  "/profile",
  zValidator("json", z.object({
    name: z.string().min(1).optional(),
    type: z.enum(["personal", "institution"]).optional(),
    institution: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
  })),
  async (c) => {
    const user = c.get("user")
    const body = c.req.valid("json")

    const trusteeRows = await db
      .select()
      .from(trustees)
      .where(eq(trustees.profileId, user.userId))

    if (trusteeRows.length === 0) {
      return c.json({ error: "Profil wali amanah tidak ditemukan" }, 404)
    }

    const trustee = trusteeRows[0]
    const updates: Record<string, unknown> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.type !== undefined) updates.type = body.type
    if (body.institution !== undefined) updates.institution = body.institution
    if (body.email !== undefined) updates.email = body.email || null

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "Tidak ada perubahan" }, 400)
    }

    const [updated] = await db
      .update(trustees)
      .set(updates)
      .where(eq(trustees.id, trustee.id))
      .returning()

    return c.json({ trustee: updated })
  }
)

trusteeAppRoutes.get("/requests", async (c) => {
  const user = c.get("user")

  const trusteeRows = await db
    .select()
    .from(trustees)
    .where(eq(trustees.profileId, user.userId))

  if (trusteeRows.length === 0) {
    return c.json({ requests: [] })
  }

  const trustee = trusteeRows[0]

  const requests = await db
    .select({
      id: trusteeRequests.id,
      loanId: trusteeRequests.loanId,
      trusteeId: trusteeRequests.trusteeId,
      status: trusteeRequests.status,
      createdAt: trusteeRequests.createdAt,
      respondedAt: trusteeRequests.respondedAt,
      loan: {
        id: loans.id,
        amount: loans.amount,
        durationMonths: loans.durationMonths,
        purpose: loans.purpose,
        collateralType: loans.collateralType,
        collateralDescription: loans.collateralDescription,
        collateralStatus: loans.collateralStatus,
        status: loans.status,
        borrowerAlias: loans.borrowerAlias,
        borrowerId: loans.borrowerId,
        lenderId: loans.lenderId,
      },
    })
    .from(trusteeRequests)
    .innerJoin(loans, eq(trusteeRequests.loanId, loans.id))
    .where(eq(trusteeRequests.trusteeId, trustee.id))
    .orderBy(desc(trusteeRequests.createdAt))

  return c.json({ requests })
})

trusteeAppRoutes.patch("/requests/:id/accept", async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!

  const trusteeRows = await db
    .select()
    .from(trustees)
    .where(eq(trustees.profileId, user.userId))

  if (trusteeRows.length === 0) {
    return c.json({ error: "Profil wali amanah tidak ditemukan" }, 404)
  }

  const trustee = trusteeRows[0]

  const [request] = await db
    .select()
    .from(trusteeRequests)
    .where(and(eq(trusteeRequests.id, id), eq(trusteeRequests.trusteeId, trustee.id)))

  if (!request) {
    return c.json({ error: "Permintaan tidak ditemukan" }, 404)
  }

  if (request.status !== "pending") {
    return c.json({ error: "Permintaan sudah diproses" }, 400)
  }

  await db
    .update(trusteeRequests)
    .set({ status: "accepted", respondedAt: new Date() })
    .where(eq(trusteeRequests.id, id))

  if (request.loanId) {
    const [loan] = await db.select().from(loans).where(eq(loans.id, request.loanId))
    if (loan) {
      await db
        .update(loans)
        .set({ trusteeId: trustee.id, collateralStatus: "held", updatedAt: new Date() })
        .where(eq(loans.id, request.loanId))
    }
  }

  const [updated] = await db.select().from(trusteeRequests).where(eq(trusteeRequests.id, id))

  return c.json({ request: updated })
})

trusteeAppRoutes.patch("/requests/:id/decline", async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")!

  const trusteeRows = await db
    .select()
    .from(trustees)
    .where(eq(trustees.profileId, user.userId))

  if (trusteeRows.length === 0) {
    return c.json({ error: "Profil wali amanah tidak ditemukan" }, 404)
  }

  const trustee = trusteeRows[0]

  const [request] = await db
    .select()
    .from(trusteeRequests)
    .where(and(eq(trusteeRequests.id, id), eq(trusteeRequests.trusteeId, trustee.id)))

  if (!request) {
    return c.json({ error: "Permintaan tidak ditemukan" }, 404)
  }

  if (request.status !== "pending") {
    return c.json({ error: "Permintaan sudah diproses" }, 400)
  }

  const [updated] = await db
    .update(trusteeRequests)
    .set({ status: "declined", respondedAt: new Date() })
    .where(eq(trusteeRequests.id, id))
    .returning()

  return c.json({ request: updated })
})

trusteeAppRoutes.patch(
  "/loans/:loanId/collateral-verify",
  zValidator("json", z.object({
    isVerified: z.boolean(),
    notes: z.string().optional(),
  })),
  async (c) => {
    const user = c.get("user")
    const loanId = c.req.param("loanId")!
    const { isVerified, notes } = c.req.valid("json")

    const trusteeRows = await db
      .select()
      .from(trustees)
      .where(eq(trustees.profileId, user.userId))

    if (trusteeRows.length === 0) {
      return c.json({ error: "Profil wali amanah tidak ditemukan" }, 404)
    }

    const trustee = trusteeRows[0]

    const [loan] = await db.select().from(loans).where(eq(loans.id, loanId))

    if (!loan) {
      return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
    }

    if (loan.trusteeId !== trustee.id) {
      return c.json({ error: "Anda bukan wali amanah untuk pinjaman ini" }, 403)
    }

    if (loan.collateralStatus !== "held") {
      return c.json({ error: "Jaminan harus dalam status dipegang" }, 400)
    }

    const newStatus = isVerified ? "verified" : "held"

    const [updated] = await db
      .update(loans)
      .set({ collateralStatus: newStatus, updatedAt: new Date() })
      .where(eq(loans.id, loanId))
      .returning()

    return c.json({ loan: updated })
  }
)

trusteeAppRoutes.patch("/loans/:loanId/collateral-return", async (c) => {
  const user = c.get("user")
  const loanId = c.req.param("loanId")!

  const trusteeRows = await db
    .select()
    .from(trustees)
    .where(eq(trustees.profileId, user.userId))

  if (trusteeRows.length === 0) {
    return c.json({ error: "Profil wali amanah tidak ditemukan" }, 404)
  }

  const trustee = trusteeRows[0]

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId))

  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  if (loan.trusteeId !== trustee.id) {
    return c.json({ error: "Anda bukan wali amanah untuk pinjaman ini" }, 403)
  }

  if (loan.status !== "completed") {
    return c.json({ error: "Jaminan hanya bisa dikembalikan setelah pinjaman lunas" }, 400)
  }

  const [updated] = await db
    .update(loans)
    .set({ collateralStatus: "returned", updatedAt: new Date() })
    .where(eq(loans.id, loanId))
    .returning()

  return c.json({ loan: updated })
})

export default trusteeAppRoutes
