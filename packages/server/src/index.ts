import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import cron from "node-cron"
import { runReminderCron, runAutoDeleteCron } from "./lib/cron-jobs"
import auth from "./routes/auth"
import loanRoutes from "./routes/loans"
import trusteeRoutes from "./routes/trustees"
import trusteeAppRoutes from "./routes/trustee-app"
import paymentProofRoutes from "./routes/payment-proofs"
import installmentRoutes from "./routes/installments"
import messageRoutes from "./routes/completion-messages"
import borrowerRoutes from "./routes/borrower"
import borrowerAppRoutes from "./routes/borrower-app"
import lenderAppRoutes from "./routes/lender-applications"
import invitationRoutes from "./routes/loan-invitations"
import ratingRoutes from "./routes/lender-ratings"
import reminderRoutes from "./routes/reminders"
import adminRoutes from "./routes/admin"
import pushRoutes from "./routes/push"

const app = new Hono()

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
  : ["http://localhost:5173"]

app.use("*", cors({
  origin: corsOrigins,
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}))
app.use("*", logger())

// Serve static files from uploads directory
app.use("/uploads/*", serveStatic({ root: "./" }))

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))

app.route("/auth", auth)
app.route("/loans", loanRoutes)
app.route("/trustees", trusteeRoutes)
app.route("/trustee-app", trusteeAppRoutes)
app.route("/payment-proofs", paymentProofRoutes)
app.route("/installments", installmentRoutes)
app.route("/completion-messages", messageRoutes)
app.route("/borrower", borrowerRoutes)
app.route("/borrower-app", borrowerAppRoutes)
app.route("/lender-app", lenderAppRoutes)
app.route("/invitations", invitationRoutes)
app.route("/lender-ratings", ratingRoutes)
app.route("/reminders", reminderRoutes)
app.route("/admin", adminRoutes)
app.route("/push", pushRoutes)

const port = Number(process.env.PORT ?? 3001)

console.log(`🚀 Amanah API server running on port ${port}`)

serve({ fetch: app.fetch, port })

// Cron jobs - only run if ENABLE_CRON is set to "true"
if (process.env.ENABLE_CRON === "true") {
  // Run reminder cron daily at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[CRON] Running reminder job...")
    try {
      const result = await runReminderCron()
      console.log(`[CRON] Reminder job completed: ${result.message}`)
    } catch (err) {
      console.error("[CRON] Reminder job failed:", err)
    }
  }, { timezone: "Asia/Jakarta" })

  // Run auto-delete cron daily at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Running auto-delete job...")
    try {
      const result = await runAutoDeleteCron()
      console.log(`[CRON] Auto-delete job completed: ${result.message}`)
    } catch (err) {
      console.error("[CRON] Auto-delete job failed:", err)
    }
  }, { timezone: "Asia/Jakarta" })

  console.log("📅 Cron jobs enabled (reminders at 08:00, auto-delete at 02:00 WIB)")
}

export default app