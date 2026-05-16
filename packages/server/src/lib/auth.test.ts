import { describe, it, expect } from "vitest"
import { hashPassword, comparePassword, signAccessToken, signRefreshToken, verifyToken } from "./auth"

describe("hashPassword & comparePassword", () => {
  it("hashes and verifies password", async () => {
    const password = "test123456"
    const hash = await hashPassword(password)
    expect(hash).not.toBe(password)
    expect(hash.startsWith("$2")).toBe(true)

    const isValid = await comparePassword(password, hash)
    expect(isValid).toBe(true)

    const isInvalid = await comparePassword("wrongpassword", hash)
    expect(isInvalid).toBe(false)
  })
})

describe("JWT tokens", () => {
  it("signs and verifies access token", () => {
    const payload = { userId: "test-user-id", role: "lender" }
    const token = signAccessToken(payload)
    expect(token).toBeDefined()
    expect(typeof token).toBe("string")

    const decoded = verifyToken(token) as { userId: string; role: string }
    expect(decoded.userId).toBe("test-user-id")
    expect(decoded.role).toBe("lender")
  })

  it("signs and verifies refresh token", () => {
    const payload = { userId: "test-user-id", role: "borrower" }
    const token = signRefreshToken(payload)
    expect(token).toBeDefined()

    const decoded = verifyToken(token) as { userId: string; role: string }
    expect(decoded.userId).toBe("test-user-id")
    expect(decoded.role).toBe("borrower")
  })
})
