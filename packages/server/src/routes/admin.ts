import { Hono } from "hono"
import { eq, desc, count, sql, ilike, or, and } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { users, roleChangeRequests, loans, trustees, installments } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"

const adminRoutes = new Hono<AuthEnv>()

adminRoutes.use("/*", authMiddleware)

adminRoutes.use("/*", async (c, next) => {
  const user = c.get("user")
  if (user.role !== "admin") {
    return c.json({ error: "Akses ditolak. Hanya admin." }, 403)
  }
  await next()
})

// GET /admin/stats - Enhanced system stats
adminRoutes.get("/stats", async (c) => {
  const [userCountResult] = await db.select({ count: count() }).from(users)
  const [lenderCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "lender"))
  const [borrowerCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "borrower"))
  const [trusteeCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "trustee"))
  const [loanCountResult] = await db.select({ count: count() }).from(loans)
  const [activeLoans] = await db.select({ count: count() }).from(loans).where(eq(loans.status, "active"))
  const [pendingLoans] = await db.select({ count: count() }).from(loans).where(eq(loans.status, "pending"))
  const [completedLoans] = await db.select({ count: count() }).from(loans).where(eq(loans.status, "completed"))
  const [pendingRoleChanges] = await db.select({ count: count() }).from(roleChangeRequests).where(eq(roleChangeRequests.status, "pending"))
  const [pendingTrustees] = await db.select({ count: count() }).from(trustees).where(eq(trustees.isVerified, false))

  const [totalAmountResult] = await db.select({ sum: sql<number>`COALESCE(SUM(${loans.amount}), 0)` }).from(loans).where(eq(loans.status, "active"))

  return c.json({
    userCount: userCountResult.count,
    lenderCount: lenderCount.count,
    borrowerCount: borrowerCount.count,
    trusteeCount: trusteeCount.count,
    loanCount: loanCountResult.count,
    activeLoans: activeLoans.count,
    pendingLoans: pendingLoans.count,
    completedLoans: completedLoans.count,
    pendingRoleChanges: pendingRoleChanges.count,
    pendingTrustees: pendingTrustees.count,
    totalActiveAmount: totalAmountResult.sum,
  })
})

// GET /admin/users - List all users with search and filter
adminRoutes.get("/users", async (c) => {
  const roleRaw = c.req.query("role")
  const role = roleRaw !== "all" ? roleRaw as "lender" | "borrower" | "trustee" | "admin" | undefined : undefined
  const search = c.req.query("search")
  const verified = c.req.query("verified")

  let conditions = []

  if (role) {
    conditions.push(eq(users.role, role))
  }

  if (search) {
    conditions.push(or(
      ilike(users.email, `%${search}%`),
      ilike(users.displayName, `%${search}%`),
    ))
  }

  if (verified === "true") {
    conditions.push(eq(users.isVerified, true))
  } else if (verified === "false") {
    conditions.push(eq(users.isVerified, false))
  }

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      phone: users.phone,
      idNumber: users.idNumber,
      address: users.address,
      occupation: users.occupation,
      ktpDocumentUrl: users.ktpDocumentUrl,
      profileCompleted: users.profileCompleted,
      isVerified: users.isVerified,
      borrowerTier: users.borrowerTier,
      lenderTier: users.lenderTier,
      rating: users.rating,
      completedLoans: users.completedLoans,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))

  return c.json({ users: allUsers })
})

// PATCH /admin/users/:id - Update user (verify, suspend, change role)
adminRoutes.patch(
  "/users/:id",
  zValidator("json", z.object({
    isVerified: z.boolean().optional(),
    role: z.enum(["lender", "borrower", "trustee", "admin"]).optional(),
  })),
  async (c) => {
    const id = c.req.param("id")!
    const body = c.req.valid("json")

    const [existing] = await db.select().from(users).where(eq(users.id, id))
    if (!existing) {
      return c.json({ error: "User tidak ditemukan" }, 404)
    }

    const updates: Record<string, unknown> = {}
    if (body.isVerified !== undefined) updates.isVerified = body.isVerified
    if (body.role !== undefined) updates.role = body.role

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "Tidak ada perubahan" }, 400)
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning()

    return c.json({ user: updated })
  }
)

// GET /admin/loans - List all loans with filter
adminRoutes.get("/loans", async (c) => {
  const statusRaw = c.req.query("status")
  const status = statusRaw !== "all" ? statusRaw as "pending" | "approved" | "active" | "completed" | "defaulted" | "cancelled" | "rejected" | undefined : undefined
  const search = c.req.query("search")

  let conditions = []

  if (status) {
    conditions.push(eq(loans.status, status))
  }

  if (search) {
    conditions.push(ilike(loans.borrowerAlias, `%${search}%`))
  }

  const allLoans = await db
    .select({
      id: loans.id,
      loanCode: loans.id,
      borrowerAlias: loans.borrowerAlias,
      amount: loans.amount,
      durationMonths: loans.durationMonths,
      purpose: loans.purpose,
      collateralType: loans.collateralType,
      collateralDescription: loans.collateralDescription,
      collateralStatus: loans.collateralStatus,
      status: loans.status,
      ujrah: loans.ujrah,
      totalFee: loans.totalFee,
      disbursedAmount: loans.disbursedAmount,
      startDate: loans.startDate,
      dueDate: loans.dueDate,
      createdAt: loans.createdAt,
      lender: {
        id: users.id,
        email: users.email,
        displayName: users.displayName,
      },
    })
    .from(loans)
    .leftJoin(users, eq(loans.lenderId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(loans.createdAt))

  return c.json({ loans: allLoans })
})

// GET /admin/loans/:id - Loan detail with installments
adminRoutes.get("/loans/:id", async (c) => {
  const id = c.req.param("id")!

  const [loan] = await db
    .select({
      id: loans.id,
      borrowerAlias: loans.borrowerAlias,
      borrowerId: loans.borrowerId,
      amount: loans.amount,
      durationMonths: loans.durationMonths,
      purpose: loans.purpose,
      collateralType: loans.collateralType,
      collateralDescription: loans.collateralDescription,
      collateralStatus: loans.collateralStatus,
      status: loans.status,
      ujrah: loans.ujrah,
      stampFee: loans.stampFee,
      adminFee: loans.adminFee,
      custodyFee: loans.custodyFee,
      totalFee: loans.totalFee,
      disbursedAmount: loans.disbursedAmount,
      contractUrl: loans.contractUrl,
      startDate: loans.startDate,
      dueDate: loans.dueDate,
      createdAt: loans.createdAt,
      lender: {
        id: users.id,
        email: users.email,
        displayName: users.displayName,
      },
      trustee: {
        id: trustees.id,
        name: trustees.name,
        institution: trustees.institution,
        isVerified: trustees.isVerified,
      },
    })
    .from(loans)
    .leftJoin(users, eq(loans.lenderId, users.id))
    .leftJoin(trustees, eq(loans.trusteeId, trustees.id))
    .where(eq(loans.id, id))

  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  const loanInstallments = await db
    .select()
    .from(installments)
    .where(eq(installments.loanId, id))
    .orderBy(installments.dueDate)

  return c.json({ loan, installments: loanInstallments })
})

// GET /admin/trustees - List all trustees with verification status
adminRoutes.get("/trustees", async (c) => {
  const verified = c.req.query("verified")

  let conditions = []
  if (verified === "true") {
    conditions.push(eq(trustees.isVerified, true))
  } else if (verified === "false") {
    conditions.push(eq(trustees.isVerified, false))
  }

  const allTrustees = await db
    .select({
      id: trustees.id,
      name: trustees.name,
      type: trustees.type,
      email: trustees.email,
      institution: trustees.institution,
      isVerified: trustees.isVerified,
      createdAt: trustees.createdAt,
      user: {
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        phone: users.phone,
        idNumber: users.idNumber,
        ktpDocumentUrl: users.ktpDocumentUrl,
      },
    })
    .from(trustees)
    .leftJoin(users, eq(trustees.profileId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(trustees.createdAt))

  return c.json({ trustees: allTrustees })
})

// PATCH /admin/trustees/:id/verify - Verify or unverify a trustee
adminRoutes.patch(
  "/trustees/:id/verify",
  zValidator("json", z.object({
    isVerified: z.boolean(),
  })),
  async (c) => {
    const id = c.req.param("id")!
    const { isVerified } = c.req.valid("json")

    const [existing] = await db.select().from(trustees).where(eq(trustees.id, id))
    if (!existing) {
      return c.json({ error: "Wali amanah tidak ditemukan" }, 404)
    }

    const [updated] = await db
      .update(trustees)
      .set({ isVerified })
      .where(eq(trustees.id, id))
      .returning()

    return c.json({ trustee: updated })
  }
)

// GET /admin/role-change-requests - List all pending role change requests
adminRoutes.get("/role-change-requests", async (c) => {
  const requests = await db
    .select({
      id: roleChangeRequests.id,
      userId: roleChangeRequests.userId,
      requestedRole: roleChangeRequests.requestedRole,
      status: roleChangeRequests.status,
      createdAt: roleChangeRequests.createdAt,
      reviewedAt: roleChangeRequests.reviewedAt,
      user: {
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
      },
    })
    .from(roleChangeRequests)
    .innerJoin(users, eq(roleChangeRequests.userId, users.id))
    .orderBy(desc(roleChangeRequests.createdAt))

  return c.json({ requests })
})

// PATCH /admin/role-change-requests/:id/review - Approve or reject
adminRoutes.patch(
  "/role-change-requests/:id/review",
  zValidator("json", z.object({
    action: z.enum(["approved", "rejected"]),
  })),
  async (c) => {
    const adminUser = c.get("user")
    const id = c.req.param("id")!
    const { action } = c.req.valid("json")

    const [request] = await db
      .select()
      .from(roleChangeRequests)
      .where(eq(roleChangeRequests.id, id))

    if (!request) {
      return c.json({ error: "Permintaan tidak ditemukan" }, 404)
    }

    if (request.status !== "pending") {
      return c.json({ error: "Permintaan sudah diproses" }, 400)
    }

    await db
      .update(roleChangeRequests)
      .set({
        status: action,
        reviewedAt: new Date(),
      })
      .where(eq(roleChangeRequests.id, id))

    if (action === "approved") {
      await db
        .update(users)
        .set({ role: request.requestedRole })
        .where(eq(users.id, request.userId))
    }

    const [updated] = await db
      .select()
      .from(roleChangeRequests)
      .where(eq(roleChangeRequests.id, id))

    return c.json({ request: updated })
  }
)

export default adminRoutes
