import { db } from "./db"
import { users } from "./db/schema"
import { eq } from "drizzle-orm"
import { comparePassword } from "./lib/auth"

async function testAdminLogin() {
  const [user] = await db.select().from(users).where(eq(users.email, "admin@amanah.test"))
  
  if (!user) {
    console.log("❌ admin@amanah.test not found")
    process.exit(1)
  }

  console.log("User details:")
  console.log(`  id: ${user.id}`)
  console.log(`  email: ${user.email}`)
  console.log(`  role: ${user.role}`)
  console.log(`  displayName: ${user.displayName}`)
  console.log(`  profileCompleted: ${user.profileCompleted}`)
  console.log(`  isVerified: ${user.isVerified}`)

  const isValid = await comparePassword("password123", user.passwordHash)
  console.log(`  password valid: ${isValid}`)

  if (user.role === null) {
    console.log("\n⚠️  Role is NULL! This causes redirect to /onboarding")
    console.log("Fixing role to 'admin'...")
    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id))
    console.log("✅ Fixed!")
  }

  process.exit(0)
}

testAdminLogin().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
