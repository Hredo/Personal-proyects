import { and, eq, gt } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { sessions, users, userPlan, type Plan, type User } from "@/lib/db/schema"
import {
  parseSessionCookie,
  verifySessionToken,
} from "@/lib/auth/session"

export type SessionUser = Pick<User, "id" | "email" | "name" | "plan" | "role">

export async function getCurrentUser(
  cookieHeader: string | null,
): Promise<SessionUser | null> {
  const token = parseSessionCookie(cookieHeader)
  if (!token) return null
  const verified = verifySessionToken(token)
  if (!verified) return null
  const db = getDb()
  const now = new Date()
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      role: users.role,
      sessionExpiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(eq(sessions.id, verified.sessionId), gt(sessions.expiresAt, now)),
    )
    .limit(1)
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    plan: row.plan,
    role: row.role,
  }
}

export function isPro(u: SessionUser | null | undefined): boolean {
  const p = userPlan(u ?? null)
  return p === "pro" || p === "admin"
}

export function isAdmin(u: SessionUser | null | undefined): boolean {
  return userPlan(u ?? null) === "admin"
}

export function planLabel(p: Plan): string {
  if (p === "admin") return "Admin"
  if (p === "pro") return "Pro"
  return "Free"
}
