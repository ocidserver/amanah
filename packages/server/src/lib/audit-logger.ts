import { db } from "../db"
import { auditLogs } from "../db/schema"

interface AuditLogEntry {
  adminId: string
  action: string
  entityType: string
  entityId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      adminId: entry.adminId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      details: entry.details ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    })
  } catch (err) {
    console.error("Failed to create audit log:", err)
  }
}

export function getClientInfo(c: { req: { header: (name: string) => string | undefined } }) {
  return {
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? null,
    userAgent: c.req.header("user-agent") ?? null,
  }
}
