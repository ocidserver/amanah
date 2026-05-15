import { Context, Next } from "hono"
import { AuthEnv } from "./auth"

export async function lenderOnlyMiddleware(c: Context<AuthEnv>, next: Next) {
  const user = c.get("user")
  if (user.role !== "lender" && user.role !== "admin") {
    return c.json({ error: "Akses ditolak. Hanya untuk pemberi pinjaman." }, 403)
  }
  await next()
}

export async function borrowerOnlyMiddleware(c: Context<AuthEnv>, next: Next) {
  const user = c.get("user")
  if (user.role !== "borrower" && user.role !== "admin") {
    return c.json({ error: "Akses ditolak. Hanya untuk peminjam." }, 403)
  }
  await next()
}

export async function adminOnlyMiddleware(c: Context<AuthEnv>, next: Next) {
  const user = c.get("user")
  if (user.role !== "admin") {
    return c.json({ error: "Akses ditolak. Hanya untuk administrator." }, 403)
  }
  await next()
}