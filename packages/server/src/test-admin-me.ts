import { db } from "./db"
import { users } from "./db/schema"
import { eq } from "drizzle-orm"
import { signAccessToken } from "./lib/auth"

async function testAdminMeEndpoint() {
  const [user] = await db.select().from(users).where(eq(users.email, "admin@amanah.test"))
  
  if (!user) {
    console.log("❌ admin@amanah.test not found")
    process.exit(1)
  }

  // Simulate what GET /auth/me returns
  const response = {
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
  }

  console.log("GET /auth/me response for admin@amanah.test:")
  console.log(JSON.stringify(response, null, 2))

  // Simulate JWT payload
  const payload = { userId: user.id, role: user.role ?? "pending" }
  console.log("\nJWT payload:", JSON.stringify(payload, null, 2))

  // Generate a test token
  const token = signAccessToken(payload)
  console.log("\nTest access token (first 50 chars):", token.substring(0, 50) + "...")

  process.exit(0)
}

testAdminMeEndpoint().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
