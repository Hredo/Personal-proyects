import { NextResponse } from "next/server"
import { randomInt } from "node:crypto"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { users, twoFactorSessions } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"
import { hashPassword } from "@/lib/auth/password"
import { sendTwoFactorSetupEmail } from "@/lib/auth/email"
import { clientIp, readRateLimit } from "@/lib/security/ai-advisor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const sessionUser = await getCurrentUser(request.headers.get("cookie"))
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const limited = readRateLimit(clientIp(request), "account:2fa-enable", 3, 0.02)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    )
  }

  const db = getDb()
  const userRows = await db
    .select({ twoFactorEnabled: users.twoFactorEnabled })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1)

  if (userRows.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  if (userRows[0].twoFactorEnabled) {
    return NextResponse.json(
      { error: "Two-factor authentication is already enabled." },
      { status: 400 },
    )
  }

  const code = String(randomInt(100000, 999999))
  const codeHash = await hashPassword(code)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await db.delete(twoFactorSessions).where(eq(twoFactorSessions.userId, sessionUser.id))

  const tfaRows = await db
    .insert(twoFactorSessions)
    .values({
      userId: sessionUser.id,
      codeHash,
      expiresAt,
    })
    .returning({ id: twoFactorSessions.id })

  const tfaId = tfaRows[0]?.id
  if (!tfaId) {
    return NextResponse.json(
      { error: "Could not initiate setup. Please try again." },
      { status: 500 },
    )
  }

  await sendTwoFactorSetupEmail(sessionUser.email, code)

  return NextResponse.json({
    ok: true,
    message: "Verification code sent to your email.",
    sessionId: tfaId,
  })
}
