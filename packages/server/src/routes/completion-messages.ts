import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { completionMessages, loans } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"

const messageRoutes = new Hono<AuthEnv>()

const createMessageSchema = z.object({
  message: z.string().min(1).max(500),
})

messageRoutes.get("/loan/:loanId", authMiddleware, async (c) => {
  const user = c.get("user")
  const loanId = c.req.param("loanId")!

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId))
  if (!loan || loan.lenderId !== user.userId) {
    return c.json({ error: "Loan not found" }, 404)
  }

  const [msg] = await db
    .select()
    .from(completionMessages)
    .where(eq(completionMessages.loanId, loanId))

  return c.json({ message: msg ?? null })
})

messageRoutes.post("/loan/:loanId", authMiddleware, zValidator("json", createMessageSchema), async (c) => {
  const user = c.get("user")
  const loanId = c.req.param("loanId")!
  const body = c.req.valid("json")

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId))
  if (!loan || loan.lenderId !== user.userId) {
    return c.json({ error: "Loan not found" }, 404)
  }

  if (!loan.doaLunasEnabled) {
    return c.json({ error: "Doa lunas is not enabled for this loan" }, 400)
  }

  const existing = await db
    .select()
    .from(completionMessages)
    .where(eq(completionMessages.loanId, loanId))

  if (existing.length > 0) {
    return c.json({ error: "Doa lunas already exists for this loan" }, 409)
  }

  const [newMsg] = await db
    .insert(completionMessages)
    .values({ loanId, message: body.message })
    .returning()

  return c.json({ message: newMsg }, 201)
})

export default messageRoutes