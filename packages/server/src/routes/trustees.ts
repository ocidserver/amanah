import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "../db"
import { trustees } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"

const trusteeRoutes = new Hono<AuthEnv>()

trusteeRoutes.use("/*", authMiddleware)

const createTrusteeSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["personal", "institution"]).default("personal"),
  email: z.string().email().optional(),
  institution: z.string().optional(),
})

trusteeRoutes.get("/", async (c) => {
  const user = c.get("user")

  const allTrustees = await db
    .select()
    .from(trustees)
    .where(eq(trustees.createdBy, user.userId))
    .orderBy(trustees.createdAt)

  return c.json({ trustees: allTrustees })
})

trusteeRoutes.post("/", zValidator("json", createTrusteeSchema), async (c) => {
  const user = c.get("user")
  const body = c.req.valid("json")

  const [newTrustee] = await db
    .insert(trustees)
    .values({
      name: body.name,
      type: body.type,
      email: body.email ?? null,
      institution: body.institution ?? null,
      createdBy: user.userId,
    })
    .returning()

  return c.json({ trustee: newTrustee }, 201)
})

trusteeRoutes.get("/:id", async (c) => {
  const user = c.get("user")
  const id = c.req.param("id")

  const [trustee] = await db
    .select()
    .from(trustees)
    .where(eq(trustees.id, id))

  if (!trustee || trustee.createdBy !== user.userId) {
    return c.json({ error: "Trustee not found" }, 404)
  }

  return c.json({ trustee })
})

export default trusteeRoutes