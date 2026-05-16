import "dotenv/config"
import { db } from "./src/db"
import { users, emailVerificationTokens } from "./src/db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { sendEmailVerification } from "./src/lib/email"

async function main() {
  const testEmail = "rasyidka@gmail.com"

  console.log("🔍 Finding user...")
  const [user] = await db.select({ id: users.id, email: users.email, isVerified: users.isVerified }).from(users).where(eq(users.email, testEmail))

  if (!user) {
    console.log("❌ User not found")
    return
  }

  console.log(`User: ${user.email}`)
  console.log(`isVerified: ${user.isVerified}`)

  if (user.isVerified) {
    console.log("⚠️  User already verified. Resetting...")
    await db.update(users).set({ isVerified: false }).where(eq(users.id, user.id))
  }

  console.log("\n🗑️  Cleaning old tokens...")
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id))

  console.log("\n📧 Generating verification token...")
  const verificationToken = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token: verificationToken,
    expiresAt,
  })

  const appUrl = process.env.APP_URL ?? "http://localhost:5173"
  const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`

  console.log(`\n📧 Sending verification email to: ${user.email}`)
  await sendEmailVerification(user.email, "Abdur", verificationUrl)
  console.log("✅ Email sent successfully!")

  console.log(`\n🔗 Verification URL:`)
  console.log(verificationUrl)
  console.log(`\n⏳ Waiting for you to click the link...`)
  console.log("   (Script will check every 5 seconds for up to 5 minutes)")

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const [updatedUser] = await db.select({ isVerified: users.isVerified }).from(users).where(eq(users.id, user.id))
    if (updatedUser.isVerified) {
      console.log("\n✅ Email verified successfully!")
      return
    }
    process.stdout.write(".")
  }

  console.log("\n⏰ Timeout. Please try again.")
}

main().catch(console.error)
