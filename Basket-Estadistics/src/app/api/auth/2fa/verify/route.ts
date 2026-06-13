import { NextResponse } from "next/server"
import { z } from "zod"
import { eq, and, gt } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import {
  twoFactorSessions,
  twoFactorBackupCodes,
  sessions,
  users,
} from "@/lib/db/schema"
import { verifyPassword } from "@/lib/auth/password"
import {
  buildSessionCookie,
  getSessionTtlMs,
  newSessionId,
  signSessionToken,
} from "@/lib/auth/session"
import { clientIp } from "@/lib/security/ai-advisor"
import { consumeRateLimit } from "@/lib/security/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  sessionId: z.string().uuid(),
  code: z.string().min(1).max(64),
})

const MAX_2FA_ATTEMPTS = 5

export async function POST(request: Request) {
  const limited = await consumeRateLimit(
    `auth:2fa-verify:${clientIp(request)}`,
    5,
    2 * 60 * 1000,
  )
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
    return NextResponse.json({ error: "Invalid verification data." }, { status: 400 })
  }
  const { sessionId, code } = parsed.data

  const db = getDb()
  const now = new Date()

  const tfaRows = await db
    .select({
      id: twoFactorSessions.id,
      userId: twoFactorSessions.userId,
      codeHash: twoFactorSessions.codeHash,
      attempts: twoFactorSessions.attempts,
      verified: twoFactorSessions.verified,
    })
    .from(twoFactorSessions)
    .where(
      and(
        eq(twoFactorSessions.id, sessionId),
        gt(twoFactorSessions.expiresAt, now),
      ),
    )
    .limit(1)

  if (tfaRows.length === 0) {
    return NextResponse.json(
      { error: "Verification session expired or invalid. Please sign in again." },
      { status: 400 },
    )
  }

  const tfa = tfaRows[0]

  if (tfa.verified) {
    return NextResponse.json(
      { error: "This session has already been verified." },
      { status: 400 },
    )
  }

  if (tfa.attempts >= MAX_2FA_ATTEMPTS) {
    await db
      .delete(twoFactorSessions)
      .where(eq(twoFactorSessions.id, sessionId))
    return NextResponse.json(
      { error: "Too many incorrect attempts. Please sign in again." },
      { status: 429 },
    )
  }

  await db
    .update(twoFactorSessions)
    .set({ attempts: tfa.attempts + 1 })
    .where(eq(twoFactorSessions.id, sessionId))

  const isBackupCode = code.length > 8

  if (isBackupCode) {
    const backupRows = await db
      .select({
        id: twoFactorBackupCodes.id,
        codeHash: twoFactorBackupCodes.codeHash,
      })
      .from(twoFactorBackupCodes)
      .where(
        and(
          eq(twoFactorBackupCodes.userId, tfa.userId),
          eq(twoFactorBackupCodes.used, false),
        ),
      )
      .limit(20)

    let matchedBackupId: string | null = null
    for (const row of backupRows) {
      const valid = await verifyPassword(code, row.codeHash)
      if (valid) {
        matchedBackupId = row.id
        break
      }
    }

    if (!matchedBackupId) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 },
      )
    }

    await db
      .update(twoFactorBackupCodes)
      .set({ used: true })
      .where(eq(twoFactorBackupCodes.id, matchedBackupId))
  } else {
    const valid = await verifyPassword(code, tfa.codeHash)
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 },
      )
    }
  }

  const sessionIdStr = newSessionId()
  const ttlMs = getSessionTtlMs()
  const expiresAt = new Date(Date.now() + ttlMs)
  const ip = clientIp(request)
  const ua = request.headers.get("user-agent") ?? null

  await db.insert(sessions).values({
    id: sessionIdStr,
    userId: tfa.userId,
    expiresAt,
    userAgent: ua ? ua.slice(0, 250) : null,
    ip: ip !== "unknown" ? ip.slice(0, 60) : null,
  })

  await db
    .delete(twoFactorSessions)
    .where(eq(twoFactorSessions.id, sessionId))

  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, tfa.userId))
    .limit(1)

  const user = userRows[0]
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const token = signSessionToken(sessionIdStr, tfa.userId, ttlMs)
  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      role: user.role,
    },
  })
  res.headers.append("Set-Cookie", buildSessionCookie(token, ttlMs))
  return res
}
