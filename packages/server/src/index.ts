import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { serve } from "@hono/node-server"
import auth from "./routes/auth"
import loanRoutes from "./routes/loans"
import trusteeRoutes from "./routes/trustees"
import installmentRoutes from "./routes/installments"
import messageRoutes from "./routes/completion-messages"
import borrowerRoutes from "./routes/borrower"
import invitationRoutes from "./routes/loan-invitations"
import ratingRoutes from "./routes/lender-ratings"

const app = new Hono()

app.use("*", cors())
app.use("*", logger())

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))

app.route("/auth", auth)
app.route("/loans", loanRoutes)
app.route("/trustees", trusteeRoutes)
app.route("/installments", installmentRoutes)
app.route("/completion-messages", messageRoutes)
app.route("/borrower", borrowerRoutes)
app.route("/invitations", invitationRoutes)
app.route("/lender-ratings", ratingRoutes)

const port = Number(process.env.PORT ?? 3001)

console.log(`🚀 Amanah API server running on port ${port}`)

serve({ fetch: app.fetch, port })

export default app