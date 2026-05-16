import { db } from "./db"
import { users } from "./db/schema"
import { hashPassword } from "./lib/auth"

const PASSWORD = "Password123!"

async function seedDummyAccounts() {
  const passwordHash = await hashPassword(PASSWORD)

  const dummyUsers = [
    {
      email: "peminjam@amanah.test",
      displayName: "Ahmad Peminjam",
      passwordHash,
      role: "borrower" as const,
    },
    {
      email: "pemberi@amanah.test",
      displayName: "Siti Pemberi",
      passwordHash,
      role: "lender" as const,
    },
    {
      email: "wali@amanah.test",
      displayName: "Budi Wali",
      passwordHash,
      role: "trustee" as const,
    },
    {
      email: "admin@amanah.test",
      displayName: "Admin Amanah",
      passwordHash,
      role: "admin" as const,
    },
  ]

  for (const u of dummyUsers) {
    try {
      const result = await db
        .insert(users)
        .values(u)
        .returning({ id: users.id, email: users.email, role: users.role })
      console.log(`✅ Created: ${result[0].email} (${result[0].role})`)
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("duplicate key")) {
        console.log(`⏭️  Already exists: ${u.email}`)
      } else {
        console.error(`❌ Failed: ${u.email}`, err)
      }
    }
  }

  console.log("\n📋 Dummy Accounts:")
  console.log("========================================")
  console.log("Peminjam:  peminjam@amanah.test")
  console.log("Pemberi:   pemberi@amanah.test")
  console.log("Wali:      wali@amanah.test")
  console.log("Admin:     admin@amanah.test")
  console.log("Password:  Password123!")
  console.log("========================================")

  process.exit(0)
}

seedDummyAccounts().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
