import { db } from "./db"
import { users } from "./db/schema"
import { eq, isNull } from "drizzle-orm"

async function checkAndFixAdmin() {
  const adminUsers = await db.select().from(users).where(eq(users.role, "admin"))
  
  if (adminUsers.length === 0) {
    console.log("❌ No admin user found with role='admin'")
    
    // Check if admin@amanah.test exists with null role
    const [maybeAdmin] = await db.select().from(users).where(eq(users.email, "admin@amanah.test"))
    if (maybeAdmin) {
      console.log(`Found admin@amanah.test with role=${maybeAdmin.role}`)
      console.log("Fixing role to 'admin'...")
      await db.update(users).set({ role: "admin" }).where(eq(users.id, maybeAdmin.id))
      console.log("✅ Fixed!")
    } else {
      console.log("admin@amanah.test does not exist at all")
    }
  } else {
    console.log(`✅ Found ${adminUsers.length} admin user(s):`)
    adminUsers.forEach(u => console.log(`  - ${u.email} (id: ${u.id})`))
  }

  // Also check all users with null role
  const nullRoleUsers = await db.select().from(users).where(isNull(users.role))
  if (nullRoleUsers.length > 0) {
    console.log(`\n⚠️  ${nullRoleUsers.length} user(s) with null role:`)
    nullRoleUsers.forEach(u => console.log(`  - ${u.email} (role: ${u.role})`))
  }

  // List all users
  const allUsers = await db.select({ id: users.id, email: users.email, role: users.role }).from(users)
  console.log("\n📋 All users:")
  allUsers.forEach(u => console.log(`  ${u.email} → role: ${u.role}`))

  process.exit(0)
}

checkAndFixAdmin().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
