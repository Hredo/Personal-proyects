import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { users, twoFactorBackupCodes } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"
import { verifyPassword } from "@/lib/auth/password"
import { clientIp, readRateLimit } from "@/lib/security/ai-advisor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  password: z.string().min(1).max(200),
})

export async function POST(request: Request) {
  const sessionUser = await getCurrentUser(request.headers.get("cookie"))
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const limited = readRateLimit(clientIp(request), "account:2fa-disable", 3, 0.02)
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
    return NextResponse.json({ error: "Password is required." }, { status: 400 })
  }
  const { password } = parsed.data

  const db = getDb()
  const userRows = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1)

  if (!userRows[0]?.passwordHash) {
    return NextResponse.json({ error: "No password set." }, { status: 400 })
  }

  const valid = await verifyPassword(password, userRows[0].passwordHash)
  if (!valid) {
    return NextResponse.json(
      { error: "Password is incorrect." },
      { status: 400 },
    )
  }

  await db
    .update(users)
    .set({ twoFactorEnabled: false, updatedAt: new Date() })
    .where(eq(users.id, sessionUser.id))

  await db
    .delete(twoFactorBackupCodes)
    .where(eq(twoFactorBackupCodes.userId, sessionUser.id))

  return NextResponse.json({
    ok: true,
    message: "Two-factor authentication disabled.",
  })
}
