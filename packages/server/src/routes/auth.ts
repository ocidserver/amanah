import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { users, refreshTokens, roleChangeRequests } from "../db/schema"
import { signAccessToken, signRefreshToken, verifyToken, hashPassword, comparePassword } from "../lib/auth"
import { authMiddleware, AuthEnv } from "../middleware/auth"

const auth = new Hono<AuthEnv>()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password minimal 6 karakter"),
  displayName: z.string().min(1).optional(),
  role: z.enum(["lender", "borrower"]).default("lender"),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
})

const roleChangeSchema = z.object({
  requestedRole: z.enum(["lender", "borrower", "trustee"]),
})

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email: rawEmail, password, displayName, role } = c.req.valid("json")
  const email = rawEmail.toLowerCase()

  const [existing] = await db.select().from(users).where(eq(users.email, email))
  if (existing) {
    return c.json({ error: "Email sudah terdaftar" }, 409)
  }

  const passwordHash = await hashPassword(password)

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      displayName: displayName ?? null,
      role,
    })
    .returning()

  const payload = { userId: newUser.id, role: newUser.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  await db.insert(refreshTokens).values({
    userId: newUser.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return c.json(
    {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        displayName: newUser.displayName,
        borrowerTier: newUser.borrowerTier,
        lenderTier: newUser.lenderTier,
        rating: newUser.rating,
      },
    },
    201
  )
})

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email: rawEmail, password } = c.req.valid("json")
  const email = rawEmail.toLowerCase()

  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user) {
    return c.json({ error: "Email atau password salah" }, 401)
  }

  const isValid = await comparePassword(password, user.passwordHash)
  if (!isValid) {
    return c.json({ error: "Email atau password salah" }, 401)
  }

  const payload = { userId: user.id, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      borrowerTier: user.borrowerTier,
      lenderTier: user.lenderTier,
      rating: user.rating,
    },
  })
})

auth.get("/me", authMiddleware, async (c) => {
  const user = c.get("user")

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.userId))
  if (!dbUser) {
    return c.json({ error: "User not found" }, 404)
  }

  return c.json({
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    displayName: dbUser.displayName,
    borrowerTier: dbUser.borrowerTier,
    lenderTier: dbUser.lenderTier,
    rating: dbUser.rating,
    ratingCount: dbUser.ratingCount,
    onTimePercentage: dbUser.onTimePercentage,
    completedLoans: dbUser.completedLoans,
    createdAt: dbUser.createdAt,
  })
})

auth.post("/refresh", zValidator("json", refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid("json")

  try {
    const payload = verifyToken(refreshToken) as { userId: string; role: string }

    const [stored] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, refreshToken))
    if (!stored) {
      return c.json({ error: "Invalid refresh token" }, 401)
    }
    if (new Date(stored.expiresAt) < new Date()) {
      await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken))
      return c.json({ error: "Refresh token expired" }, 401)
    }

    await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken))

    const newPayload = { userId: payload.userId, role: payload.role }
    const newAccessToken = signAccessToken(newPayload)
    const newRefreshToken = signRefreshToken(newPayload)

    await db.insert(refreshTokens).values({
      userId: payload.userId,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    return c.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  } catch {
    return c.json({ error: "Invalid refresh token" }, 401)
  }
})

auth.post("/logout", zValidator("json", refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid("json")
  await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken)).catch(() => {})
  return c.json({ success: true })
})

auth.post("/change-password", authMiddleware, zValidator("json", changePasswordSchema), async (c) => {
  const user = c.get("user")
  const { currentPassword, newPassword } = c.req.valid("json")

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.userId))
  if (!dbUser) {
    return c.json({ error: "User not found" }, 404)
  }

  const isValid = await comparePassword(currentPassword, dbUser.passwordHash)
  if (!isValid) {
    return c.json({ error: "Password saat ini salah" }, 400)
  }

  const newHash = await hashPassword(newPassword)
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.userId))

  await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.userId))

  const payload = { userId: user.userId, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  await db.insert(refreshTokens).values({
    userId: user.userId,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return c.json({
    accessToken,
    refreshToken,
    message: "Password berhasil diubah",
  })
})

auth.post("/role-change-request", authMiddleware, zValidator("json", roleChangeSchema), async (c) => {
  const user = c.get("user")
  const { requestedRole } = c.req.valid("json")

  if (user.role === requestedRole) {
    return c.json({ error: "Anda sudah memiliki role ini" }, 400)
  }

  const [existing] = await db.select().from(roleChangeRequests).where(
    eq(roleChangeRequests.userId, user.userId)
  )
  if (existing && existing.status === "pending") {
    return c.json({ error: "Permintaan perubahan role sudah ada" }, 409)
  }

  await db.insert(roleChangeRequests).values({
    userId: user.userId,
    requestedRole,
  })

  return c.json({ message: "Permintaan perubahan role telah dikirim" }, 201)
})

export default auth