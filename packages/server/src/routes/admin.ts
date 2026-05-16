import { Hono } from "hono"
import { eq, desc, count, sql, ilike, or, and, isNotNull, gte, lte } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { users, roleChangeRequests, loans, trustees, installments, auditLogs } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"
import { createAuditLog, getClientInfo } from "../lib/audit-logger"
import { sendRoleChangeApprovedEmail, sendRoleChangeRejectedEmail } from "../lib/email"

const adminRoutes = new Hono<AuthEnv>()

adminRoutes.use("/*", authMiddleware)

adminRoutes.use("/*", async (c, next) => {
  const user = c.get("user")
  if (user.role !== "admin") {
    return c.json({ error: "Akses ditolak. Hanya admin." }, 403)
  }
  await next()
})

function parsePagination(c: { req: { query: (name: string) => string | undefined } }) {
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20", 10)))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

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

  // Loan trend data (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const dailyLoans = await db
    .select({
      date: sql<string>`DATE(${loans.createdAt})`,
      count: count(),
      totalAmount: sql<number>`COALESCE(SUM(${loans.amount}), 0)`,
    })
    .from(loans)
    .where(gte(loans.createdAt, sevenDaysAgo))
    .groupBy(sql`DATE(${loans.createdAt})`)
    .orderBy(sql`DATE(${loans.createdAt})`)

  // Build 7-day array with zeros for missing days
  const loanTrend: { date: string; count: number; amount: number }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split("T")[0]
    const found = dailyLoans.find((row) => row.date === dateStr)
    loanTrend.push({
      date: dateStr,
      count: found ? Number(found.count) : 0,
      amount: found ? Number(found.totalAmount) : 0,
    })
  }

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
    loanTrend,
  })
})

// GET /admin/users - List all users with search, filter, and pagination
adminRoutes.get("/users", async (c) => {
  const roleRaw = c.req.query("role")
  const role = roleRaw !== "all" ? roleRaw as "lender" | "borrower" | "trustee" | "admin" | undefined : undefined
  const search = c.req.query("search")
  const verified = c.req.query("verified")
  const { page, limit, offset } = parsePagination(c)

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

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [totalResult] = await db.select({ count: count() }).from(users).where(whereClause)

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
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset)

  return c.json({ users: allUsers, total: totalResult.count, page, limit })
})

// PATCH /admin/users/:id - Update user (verify, suspend, change role)
adminRoutes.patch(
  "/users/:id",
  zValidator("json", z.object({
    isVerified: z.boolean().optional(),
    role: z.enum(["lender", "borrower", "trustee", "admin"]).optional(),
  })),
  async (c) => {
    const adminUser = c.get("user")
    const id = c.req.param("id")!
    const body = c.req.valid("json")
    const clientInfo = getClientInfo(c)

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

    const details = Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(", ")
    await createAuditLog({
      adminId: adminUser.userId,
      action: "update_user",
      entityType: "user",
      entityId: id,
      details,
      ipAddress: clientInfo.ipAddress ?? undefined,
      userAgent: clientInfo.userAgent ?? undefined,
    })

    return c.json({ user: updated })
  }
)

// GET /admin/users/:id - User detail with loan history
adminRoutes.get("/users/:id", async (c) => {
  const id = c.req.param("id")!

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))

  if (!user) {
    return c.json({ error: "User tidak ditemukan" }, 404)
  }

  const userLoans = await db
    .select({
      id: loans.id,
      borrowerAlias: loans.borrowerAlias,
      amount: loans.amount,
      status: loans.status,
      collateralType: loans.collateralType,
      createdAt: loans.createdAt,
    })
    .from(loans)
    .where(eq(loans.borrowerId, id))
    .orderBy(desc(loans.createdAt))

  const lenderLoans = await db
    .select({
      id: loans.id,
      borrowerAlias: loans.borrowerAlias,
      amount: loans.amount,
      status: loans.status,
      collateralType: loans.collateralType,
      createdAt: loans.createdAt,
    })
    .from(loans)
    .where(eq(loans.lenderId, id))
    .orderBy(desc(loans.createdAt))

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      phone: user.phone,
      idNumber: user.idNumber,
      address: user.address,
      occupation: user.occupation,
      ktpDocumentUrl: user.ktpDocumentUrl,
      profileCompleted: user.profileCompleted,
      isVerified: user.isVerified,
      borrowerTier: user.borrowerTier,
      lenderTier: user.lenderTier,
      rating: user.rating,
      ratingCount: user.ratingCount,
      onTimePercentage: user.onTimePercentage,
      completedLoans: user.completedLoans,
      createdAt: user.createdAt,
    },
    borrowerLoans: userLoans,
    lenderLoans,
  })
})

// GET /admin/documents/pending - List users with pending KTP review with pagination
adminRoutes.get("/documents/pending", async (c) => {
  const { page, limit, offset } = parsePagination(c)
  const search = c.req.query("search")

  let conditions = [isNotNull(users.ktpDocumentUrl)]

  if (search) {
    const searchConditions = [
      ilike(users.email, `%${search}%`),
      ilike(users.displayName, `%${search}%`),
    ]
    conditions.push(or(...searchConditions)!)
  }

  const whereClause = and(...conditions)

  const [totalResult] = await db.select({ count: count() }).from(users).where(whereClause)

  const pendingDocs = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      phone: users.phone,
      idNumber: users.idNumber,
      ktpDocumentUrl: users.ktpDocumentUrl,
      profileCompleted: users.profileCompleted,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset)

  return c.json({ documents: pendingDocs, total: totalResult.count, page, limit })
})

// GET /admin/loans - List all loans with filter, search, date range, and pagination
adminRoutes.get("/loans", async (c) => {
  const statusRaw = c.req.query("status")
  const status = statusRaw !== "all" ? statusRaw as "pending" | "approved" | "active" | "completed" | "defaulted" | "cancelled" | "rejected" | undefined : undefined
  const search = c.req.query("search")
  const dateFrom = c.req.query("dateFrom")
  const dateTo = c.req.query("dateTo")
  const { page, limit, offset } = parsePagination(c)

  let conditions = []

  if (status) {
    conditions.push(eq(loans.status, status))
  }

  if (search) {
    conditions.push(or(
      ilike(loans.borrowerAlias, `%${search}%`),
      ilike(users.email, `%${search}%`),
      ilike(users.displayName, `%${search}%`),
    ))
  }

  if (dateFrom) {
    conditions.push(gte(loans.createdAt, new Date(dateFrom)))
  }

  if (dateTo) {
    const endDate = new Date(dateTo)
    endDate.setHours(23, 59, 59, 999)
    conditions.push(lte(loans.createdAt, endDate))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [totalResult] = await db
    .select({ count: count() })
    .from(loans)
    .leftJoin(users, eq(loans.lenderId, users.id))
    .where(whereClause)

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
    .where(whereClause)
    .orderBy(desc(loans.createdAt))
    .limit(limit)
    .offset(offset)

  return c.json({ loans: allLoans, total: totalResult.count, page, limit })
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
      collateralProofUrl: loans.collateralProofUrl,
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

  let borrower = null
  if (loan.borrowerId) {
    const [b] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        phone: users.phone,
        idNumber: users.idNumber,
        address: users.address,
        occupation: users.occupation,
        borrowerTier: users.borrowerTier,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(eq(users.id, loan.borrowerId))
    borrower = b ?? null
  }

  return c.json({ loan, installments: loanInstallments, borrower })
})

// GET /admin/trustees - List all trustees with search, filter, and pagination
adminRoutes.get("/trustees", async (c) => {
  const verified = c.req.query("verified")
  const search = c.req.query("search")
  const { page, limit, offset } = parsePagination(c)

  let conditions = []
  if (verified === "true") {
    conditions.push(eq(trustees.isVerified, true))
  } else if (verified === "false") {
    conditions.push(eq(trustees.isVerified, false))
  }

  if (search) {
    conditions.push(or(
      ilike(trustees.name, `%${search}%`),
      ilike(trustees.institution, `%${search}%`),
      ilike(users.email, `%${search}%`),
      ilike(users.displayName, `%${search}%`),
    ))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [totalResult] = await db
    .select({ count: count() })
    .from(trustees)
    .leftJoin(users, eq(trustees.profileId, users.id))
    .where(whereClause)

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
    .where(whereClause)
    .orderBy(desc(trustees.createdAt))
    .limit(limit)
    .offset(offset)

  return c.json({ trustees: allTrustees, total: totalResult.count, page, limit })
})

// PATCH /admin/trustees/:id/verify - Verify or unverify a trustee
adminRoutes.patch(
  "/trustees/:id/verify",
  zValidator("json", z.object({
    isVerified: z.boolean(),
  })),
  async (c) => {
    const adminUser = c.get("user")
    const id = c.req.param("id")!
    const { isVerified } = c.req.valid("json")
    const clientInfo = getClientInfo(c)

    const [existing] = await db.select().from(trustees).where(eq(trustees.id, id))
    if (!existing) {
      return c.json({ error: "Wali amanah tidak ditemukan" }, 404)
    }

    const [updated] = await db
      .update(trustees)
      .set({ isVerified })
      .where(eq(trustees.id, id))
      .returning()

    await createAuditLog({
      adminId: adminUser.userId,
      action: isVerified ? "verify_trustee" : "unverify_trustee",
      entityType: "trustee",
      entityId: id,
      details: `Trustee ${existing.name} ${isVerified ? "verified" : "unverified"}`,
      ipAddress: clientInfo.ipAddress ?? undefined,
      userAgent: clientInfo.userAgent ?? undefined,
    })

    return c.json({ trustee: updated })
  }
)

// GET /admin/role-change-requests - List all role change requests with search, filter, and pagination
adminRoutes.get("/role-change-requests", async (c) => {
  const status = c.req.query("status")
  const search = c.req.query("search")
  const { page, limit, offset } = parsePagination(c)

  let conditions = []

  if (status && status !== "all") {
    conditions.push(eq(roleChangeRequests.status, status as "pending" | "approved" | "rejected"))
  }

  if (search) {
    conditions.push(or(
      ilike(users.email, `%${search}%`),
      ilike(users.displayName, `%${search}%`),
    ))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [totalResult] = await db
    .select({ count: count() })
    .from(roleChangeRequests)
    .innerJoin(users, eq(roleChangeRequests.userId, users.id))
    .where(whereClause)

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
    .where(whereClause)
    .orderBy(desc(roleChangeRequests.createdAt))
    .limit(limit)
    .offset(offset)

  return c.json({ requests, total: totalResult.count, page, limit })
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
    const clientInfo = getClientInfo(c)

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

    // Send email notification
    const [dbUser] = await db.select({ email: users.email, displayName: users.displayName, role: users.role }).from(users).where(eq(users.id, request.userId))
    if (dbUser?.email) {
      if (action === "approved") {
        sendRoleChangeApprovedEmail(dbUser.email, dbUser.displayName, dbUser.role || "pending", request.requestedRole).catch(() => {})
      } else {
        sendRoleChangeRejectedEmail(dbUser.email, dbUser.displayName, request.requestedRole).catch(() => {})
      }
    }

    const [updated] = await db
      .select()
      .from(roleChangeRequests)
      .where(eq(roleChangeRequests.id, id))

    await createAuditLog({
      adminId: adminUser.userId,
      action: action === "approved" ? "approve_role_change" : "reject_role_change",
      entityType: "role_change_request",
      entityId: id,
      details: `Role change ${action} for user ${request.userId}`,
      ipAddress: clientInfo.ipAddress ?? undefined,
      userAgent: clientInfo.userAgent ?? undefined,
    })

    return c.json({ request: updated })
  }
)

// GET /admin/audit-logs - List audit logs with filter and pagination
adminRoutes.get("/audit-logs", async (c) => {
  const entityType = c.req.query("entityType")
  const adminId = c.req.query("adminId")
  const { page, limit, offset } = parsePagination(c)

  let conditions = []

  if (entityType) {
    conditions.push(eq(auditLogs.entityType, entityType))
  }

  if (adminId) {
    conditions.push(eq(auditLogs.adminId, adminId))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [totalResult] = await db.select({ count: count() }).from(auditLogs).where(whereClause)

  const logs = await db
    .select({
      id: auditLogs.id,
      adminId: auditLogs.adminId,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      admin: {
        id: users.id,
        email: users.email,
        displayName: users.displayName,
      },
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.adminId, users.id))
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)

  return c.json({ logs, total: totalResult.count, page, limit })
})

export default adminRoutes
