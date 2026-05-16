import { Hono } from "hono"
import { eq, and, gt, isNull } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { users, refreshTokens, roleChangeRequests, passwordResetTokens, emailVerificationTokens } from "../db/schema"
import { signAccessToken, signRefreshToken, verifyToken, hashPassword, comparePassword } from "../lib/auth"
import { authMiddleware, AuthEnv } from "../middleware/auth"
import { rateLimit } from "../middleware/rate-limit"
import { sendWelcomeEmail, sendPasswordResetEmail, sendContractGeneratedEmail, sendEmailVerification } from "../lib/email"
import { validateFile, validateFileContent, saveFile } from "../lib/storage"
import { randomBytes } from "crypto"
import { generateTotpSecret, verifyTotpToken } from "../lib/totp"

const auth = new Hono<AuthEnv>()

// Rate limiting for sensitive endpoints
const authLimiter = rateLimit({ max: 10, windowMs: 15 * 60 * 1000, message: "Terlalu banyak permintaan. Silakan coba lagi dalam 15 menit." })

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password minimal 6 karakter"),
  displayName: z.string().min(1).optional(),
  role: z.enum(["lender", "borrower"]).optional(),
})

const setRoleSchema = z.object({
  role: z.enum(["lender", "borrower", "trustee"]),
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

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
})

auth.post("/register", authLimiter, zValidator("json", registerSchema), async (c) => {
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
      role: role ?? null,
    })
    .returning()

  const payload = { userId: newUser.id, role: newUser.role ?? "pending" }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  await db.insert(refreshTokens).values({
    userId: newUser.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  const verificationToken = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await db.insert(emailVerificationTokens).values({
    userId: newUser.id,
    token: verificationToken,
    expiresAt,
  })

  const appUrl = process.env.APP_URL ?? "https://amanah.app"
  sendEmailVerification(newUser.email, newUser.displayName, `${appUrl}/verify-email?token=${verificationToken}`).catch(() => {})

  return c.json(
    {
      accessToken,
      refreshToken,
      emailVerificationRequired: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        displayName: newUser.displayName,
        phone: newUser.phone,
        idNumber: newUser.idNumber,
        address: newUser.address,
        occupation: newUser.occupation,
        ktpDocumentUrl: newUser.ktpDocumentUrl,
        profileCompleted: newUser.profileCompleted,
        borrowerTier: newUser.borrowerTier,
        lenderTier: newUser.lenderTier,
        rating: newUser.rating,
      },
    },
    201
  )
})

auth.post("/set-role", authMiddleware, zValidator("json", setRoleSchema), async (c) => {
  const user = c.get("user")
  const { role } = c.req.valid("json")

  if (user.role && user.role !== "pending") {
    return c.json({ error: "Role sudah ditetapkan" }, 400)
  }

  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, user.userId))
    .returning()

  const payload = { userId: updated.id, role: updated.role ?? "pending" }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  await db.insert(refreshTokens).values({
    userId: updated.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return c.json({
    user: {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      displayName: updated.displayName,
    },
    accessToken,
    refreshToken,
  })
})

auth.post("/login", authLimiter, zValidator("json", loginSchema), async (c) => {
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

  if (user.role === "admin" && user.twoFactorEnabled && user.totpSecret) {
    return c.json({
      twoFactorRequired: true,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
    })
  }

  if (!user.isVerified) {
    return c.json({
      emailVerificationRequired: true,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
    })
  }

  const payload = { userId: user.id, role: user.role ?? "pending" }
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
  })
})

auth.get("/verify-email", zValidator("query", z.object({ token: z.string() })), async (c) => {
  const { token } = c.req.valid("query")

  const [verificationToken] = await db
    .select()
    .from(emailVerificationTokens)
    .where(and(eq(emailVerificationTokens.token, token), gt(emailVerificationTokens.expiresAt, new Date()), isNull(emailVerificationTokens.usedAt)))

  if (!verificationToken) {
    return c.json({ error: "Token verifikasi tidak valid atau sudah kedaluwarsa" }, 400)
  }

  await db
    .update(users)
    .set({ isVerified: true })
    .where(eq(users.id, verificationToken.userId))

  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.id, verificationToken.id))

  const [user] = await db.select().from(users).where(eq(users.id, verificationToken.userId))

  return c.json({
    success: true,
    message: "Email berhasil diverifikasi",
    user: {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
    },
  })
})

auth.post("/resend-verification", authLimiter, zValidator("json", z.object({ email: z.string().email() })), async (c) => {
  const { email: rawEmail } = c.req.valid("json")
  const email = rawEmail.toLowerCase()

  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user) {
    return c.json({ error: "Email tidak ditemukan" }, 404)
  }

  if (user.isVerified) {
    return c.json({ error: "Email sudah diverifikasi" }, 400)
  }

  const verificationToken = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, user.id))

  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token: verificationToken,
    expiresAt,
  })

  const appUrl = process.env.APP_URL ?? "https://amanah.app"
  sendEmailVerification(user.email, user.displayName, `${appUrl}/verify-email?token=${verificationToken}`).catch(() => {})

  return c.json({ success: true, message: "Email verifikasi dikirim ulang" })
})

const verify2faSchema = z.object({
  userId: z.string().uuid(),
  totpCode: z.string().length(6),
})

auth.post("/verify-2fa", authLimiter, zValidator("json", verify2faSchema), async (c) => {
  const { userId, totpCode } = c.req.valid("json")

  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user || !user.totpSecret || !user.twoFactorEnabled) {
    return c.json({ error: "2FA tidak aktif untuk akun ini" }, 400)
  }

  const isValid = verifyTotpToken(user.totpSecret, totpCode)
  if (!isValid) {
    return c.json({ error: "Kode 2FA tidak valid" }, 401)
  }

  const payload = { userId: user.id, role: user.role ?? "pending" }
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
    },
  })
})

const setup2faSchema = z.object({
  password: z.string().min(1),
})

auth.post("/2fa/setup", authMiddleware, zValidator("json", setup2faSchema), async (c) => {
  const user = c.get("user")
  const { password } = c.req.valid("json")

  const [existing] = await db.select().from(users).where(eq(users.id, user.userId))
  if (!existing) {
    return c.json({ error: "User tidak ditemukan" }, 404)
  }

  const isValid = await comparePassword(password, existing.passwordHash)
  if (!isValid) {
    return c.json({ error: "Password salah" }, 401)
  }

  const { secret, uri } = generateTotpSecret(existing.email)

  await db.update(users).set({ totpSecret: secret }).where(eq(users.id, user.userId))

  return c.json({
    secret,
    uri,
    message: "Scan QR code dengan aplikasi authenticator Anda",
  })
})

const enable2faSchema = z.object({
  totpCode: z.string().length(6),
})

auth.post("/2fa/enable", authMiddleware, zValidator("json", enable2faSchema), async (c) => {
  const user = c.get("user")
  const { totpCode } = c.req.valid("json")

  const [existing] = await db.select().from(users).where(eq(users.id, user.userId))
  if (!existing || !existing.totpSecret) {
    return c.json({ error: "Setup 2FA terlebih dahulu" }, 400)
  }

  const isValid = verifyTotpToken(existing.totpSecret, totpCode)
  if (!isValid) {
    return c.json({ error: "Kode 2FA tidak valid" }, 401)
  }

  await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, user.userId))

  return c.json({ enabled: true, message: "2FA berhasil diaktifkan" })
})

auth.post("/2fa/disable", authMiddleware, zValidator("json", setup2faSchema), async (c) => {
  const user = c.get("user")
  const { password } = c.req.valid("json")

  const [existing] = await db.select().from(users).where(eq(users.id, user.userId))
  if (!existing) {
    return c.json({ error: "User tidak ditemukan" }, 404)
  }

  const isValid = await comparePassword(password, existing.passwordHash)
  if (!isValid) {
    return c.json({ error: "Password salah" }, 401)
  }

  await db.update(users).set({ twoFactorEnabled: false, totpSecret: null }).where(eq(users.id, user.userId))

  return c.json({ enabled: false, message: "2FA berhasil dinonaktifkan" })
})

auth.get("/2fa/status", authMiddleware, async (c) => {
  const user = c.get("user")

  const [existing] = await db.select({ twoFactorEnabled: users.twoFactorEnabled, totpSecret: users.totpSecret }).from(users).where(eq(users.id, user.userId))
  if (!existing) {
    return c.json({ error: "User tidak ditemukan" }, 404)
  }

  return c.json({
    enabled: existing.twoFactorEnabled,
    configured: !!existing.totpSecret,
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
    phone: dbUser.phone,
    idNumber: dbUser.idNumber,
    address: dbUser.address,
    occupation: dbUser.occupation,
    ktpDocumentUrl: dbUser.ktpDocumentUrl,
    profileCompleted: dbUser.profileCompleted,
    isVerified: dbUser.isVerified,
    borrowerTier: dbUser.borrowerTier,
    lenderTier: dbUser.lenderTier,
    rating: dbUser.rating,
    ratingCount: dbUser.ratingCount,
    onTimePercentage: dbUser.onTimePercentage,
    completedLoans: dbUser.completedLoans,
    createdAt: dbUser.createdAt,
  })
})

auth.post("/upload-ktp", authMiddleware, async (c) => {
  const user = c.get("user")

  const formData = await c.req.parseBody()
  const file = formData["image"]

  if (!file || typeof file === "string") {
    return c.json({ error: "File gambar wajib diupload" }, 400)
  }

  const validation = validateFile("ktp", file)
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400)
  }

  const contentValidation = await validateFileContent(file)
  if (!contentValidation.valid) {
    return c.json({ error: contentValidation.error }, 400)
  }

  const ktpUrl = await saveFile("ktp", file, `ktp-${user.userId}`)

  await db
    .update(users)
    .set({ ktpDocumentUrl: ktpUrl })
    .where(eq(users.id, user.userId))

  return c.json({ ktpDocumentUrl: ktpUrl })
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

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  idNumber: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  occupation: z.string().max(100).optional(),
})

auth.patch("/me", authMiddleware, zValidator("json", updateProfileSchema), async (c) => {
  const user = c.get("user")
  const body = c.req.valid("json")

  const [existing] = await db.select().from(users).where(eq(users.id, user.userId))
  if (!existing) {
    return c.json({ error: "User not found" }, 404)
  }

  const updateData: Record<string, unknown> = {}
  if (body.displayName !== undefined) updateData.displayName = body.displayName
  if (body.phone !== undefined) updateData.phone = body.phone
  if (body.idNumber !== undefined) updateData.idNumber = body.idNumber
  if (body.address !== undefined) updateData.address = body.address
  if (body.occupation !== undefined) updateData.occupation = body.occupation

  const isProfileComplete = !!(
    (updateData.displayName ?? existing.displayName) &&
    (updateData.phone ?? existing.phone) &&
    (updateData.idNumber ?? existing.idNumber) &&
    (updateData.address ?? existing.address) &&
    (updateData.occupation ?? existing.occupation) &&
    existing.ktpDocumentUrl
  )
  updateData.profileCompleted = isProfileComplete

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, user.userId))
    .returning()

  if (!updated) {
    return c.json({ error: "User not found" }, 404)
  }

  return c.json({
    id: updated.id,
    email: updated.email,
    role: updated.role,
    displayName: updated.displayName,
    phone: updated.phone,
    idNumber: updated.idNumber,
    address: updated.address,
    occupation: updated.occupation,
    ktpDocumentUrl: updated.ktpDocumentUrl,
    profileCompleted: updated.profileCompleted,
    isVerified: updated.isVerified,
    borrowerTier: updated.borrowerTier,
    lenderTier: updated.lenderTier,
    rating: updated.rating,
    ratingCount: updated.ratingCount,
    onTimePercentage: updated.onTimePercentage,
    completedLoans: updated.completedLoans,
    createdAt: updated.createdAt,
  })
})

auth.post("/forgot-password", authLimiter, zValidator("json", forgotPasswordSchema), async (c) => {
  const { email: rawEmail } = c.req.valid("json")
  const email = rawEmail.toLowerCase()

  const [user] = await db.select().from(users).where(eq(users.email, email))
  // Always return success to prevent email enumeration
  if (!user) {
    return c.json({ message: "Jika email terdaftar, Anda akan menerima link reset password" })
  }

  // Invalidate any existing reset tokens
  await db
    .update(passwordResetTokens)
    .set({ expiresAt: new Date() })
    .where(and(eq(passwordResetTokens.userId, user.id), gt(passwordResetTokens.expiresAt, new Date())))

  // Generate reset token
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  })

  const resetUrl = `${process.env.APP_URL ?? "https://amanah.app"}/reset-password?token=${token}`
  sendPasswordResetEmail(user.email, user.displayName, resetUrl).catch(() => {})

  return c.json({ message: "Jika email terdaftar, Anda akan menerima link reset password" })
})

auth.post("/reset-password", authLimiter, zValidator("json", resetPasswordSchema), async (c) => {
  const { token, newPassword } = c.req.valid("json")

  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expiresAt, new Date())))

  if (!resetToken || resetToken.usedAt) {
    return c.json({ error: "Token tidak valid atau sudah kadaluarsa" }, 400)
  }

  const newHash = await hashPassword(newPassword)
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, resetToken.userId))

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id))

  // Invalidate all refresh tokens for this user
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, resetToken.userId))

  return c.json({ message: "Password berhasil diubah" })
})

export default auth