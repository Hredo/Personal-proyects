import { NextResponse } from "next/server"
import { z } from "zod"
import { and, eq, ne } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { sessions, users } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"
import {
  hashPassword,
  isStrongPassword,
  verifyPassword,
} from "@/lib/auth/password"
import { parseSessionCookie, verifySessionToken } from "@/lib/auth/session"
import { clientIp, readRateLimit } from "@/lib/security/ai-advisor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
})

export async function POST(request: Request) {
  const sessionUser = await getCurrentUser(request.headers.get("cookie"))
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const limited = readRateLimit(clientIp(request), "account:password", 5, 0.05)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid password data." }, { status: 400 })
  }
  const { currentPassword, newPassword } = parsed.data

  const db = getDb()
  const rows = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1)
  const hash = rows[0]?.passwordHash
  if (!hash) {
    return NextResponse.json(
      { error: "This account has no password set." },
      { status: 400 },
    )
  }
  const valid = await verifyPassword(currentPassword, hash)
  if (!valid) {
    return NextResponse.json(
      { error: "Your current password is incorrect." },
      { status: 400 },
    )
  }
  if (!isStrongPassword(newPassword)) {
    return NextResponse.json(
      {
        error:
          "New password must be at least 8 characters and include uppercase, lowercase and a digit.",
      },
      { status: 400 },
    )
  }

  const newHash = await hashPassword(newPassword)
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, sessionUser.id))

  // Revoke every other session so a stolen/old session can't outlive the change.
  const token = parseSessionCookie(request.headers.get("cookie"))
  const verified = token ? verifySessionToken(token) : null
  const currentSessionId = verified?.sessionId
  if (currentSessionId) {
    await db
      .delete(sessions)
      .where(
        and(
          eq(sessions.userId, sessionUser.id),
          ne(sessions.id, currentSessionId),
        ),
      )
  }

  return NextResponse.json({ ok: true })
}
