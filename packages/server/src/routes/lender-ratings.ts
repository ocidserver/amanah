import { Hono } from "hono"
import { eq, and } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { lenderRatings, loans } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"
import { borrowerOnlyMiddleware } from "../middleware/role"

const ratingRoutes = new Hono<AuthEnv>()

ratingRoutes.get("/loan/:loanId", authMiddleware, async (c) => {
  const loanId = c.req.param("loanId")!

  const [rating] = await db.select().from(lenderRatings).where(eq(lenderRatings.loanId, loanId))

  return c.json({ rating: rating ?? null })
})

ratingRoutes.post("/", authMiddleware, borrowerOnlyMiddleware, zValidator("json", z.object({
  loanId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(500).optional(),
})), async (c) => {
  const user = c.get("user")
  const { loanId, rating, review } = c.req.valid("json")

  const [loan] = await db.select().from(loans).where(and(eq(loans.id, loanId), eq(loans.borrowerId, user.userId)))
  if (!loan) {
    return c.json({ error: "Pinjaman tidak ditemukan" }, 404)
  }

  if (loan.status !== "completed") {
    return c.json({ error: "Hanya bisa memberi rating untuk pinjaman yang sudah lunas" }, 400)
  }

  const [existing] = await db.select().from(lenderRatings).where(eq(lenderRatings.loanId, loanId))
  if (existing) {
    return c.json({ error: "Rating sudah diberikan" }, 409)
  }

  const [newRating] = await db
    .insert(lenderRatings)
    .values({
      loanId,
      borrowerId: user.userId,
      lenderId: loan.lenderId,
      rating,
      review: review ?? null,
    })
    .returning()

  return c.json({ rating: newRating }, 201)
})

export default ratingRoutes