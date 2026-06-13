import { NextResponse } from "next/server"
import { z } from "zod"
import { randomInt } from "node:crypto"
import { getDb } from "@/lib/db/client"
import {
  sessions,
  users,
  twoFactorSessions,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import {
  buildSessionCookie,
  getSessionTtlMs,
  newSessionId,
  signSessionToken,
} from "@/lib/auth/session"
import { sendTwoFactorCodeEmail } from "@/lib/auth/email"
import { clientIp } from "@/lib/security/ai-advisor"
import { consumeRateLimit } from "@/lib/security/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
  website: z.string().max(0).optional(),
})

// Per-IP brute-force guard. Persistent (Postgres-backed) so it holds across
// serverless invocations, unlike an in-memory counter.
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 12

export async function POST(request: Request) {
  const ip = clientIp(request)
  const limited = await consumeRateLimit(
    `login:${ip}`,
    MAX_ATTEMPTS,
    ATTEMPT_WINDOW_MS,
  )
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in a few minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    )
  }
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }
  const { email, password } = parsed.data

  const db = getDb()
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      role: users.role,
      passwordHash: users.passwordHash,
      twoFactorEnabled: users.twoFactorEnabled,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  const user = rows[0]

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    )
  }
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    )
  }

  if (user.twoFactorEnabled) {
    const code = String(randomInt(100000, 999999))
    const codeHash = await hashPassword(code)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    const tfaRows = await db
      .insert(twoFactorSessions)
      .values({
        userId: user.id,
        codeHash,
        expiresAt,
      })
      .returning({ id: twoFactorSessions.id })

    const tfaId = tfaRows[0]?.id
    if (!tfaId) {
      return NextResponse.json(
        { error: "Could not initiate two-factor authentication." },
        { status: 500 },
      )
    }

    void sendTwoFactorCodeEmail(user.email, code)

    return NextResponse.json({
      ok: true,
      requiresTwoFactor: true,
      twoFactorSessionId: tfaId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
      },
    })
  }

  const sessionId = newSessionId()
  const ttlMs = getSessionTtlMs()
  const expiresAt = new Date(Date.now() + ttlMs)
  const ua = request.headers.get("user-agent") ?? null
  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
    userAgent: ua ? ua.slice(0, 250) : null,
    ip: ip !== "unknown" ? ip.slice(0, 60) : null,
  })

  const token = signSessionToken(sessionId, user.id, ttlMs)
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
