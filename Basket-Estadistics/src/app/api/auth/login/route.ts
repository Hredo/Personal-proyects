import { NextResponse } from "next/server"
import { z } from "zod"
import { getDb } from "@/lib/db/client"
import { sessions, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { verifyPassword } from "@/lib/auth/password"
import {
  buildSessionCookie,
  getSessionTtlMs,
  newSessionId,
  signSessionToken,
} from "@/lib/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
  website: z.string().max(0).optional(),
})

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 10
const attempts = new Map<string, { count: number; resetAt: number }>()

function clientKey(request: Request): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  return ip
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const cur = attempts.get(key)
  if (!cur) return false
  if (cur.resetAt < now) {
    attempts.delete(key)
    return false
  }
  return cur.count >= MAX_ATTEMPTS
}

function recordAttempt(key: string, success: boolean): void {
  const now = Date.now()
  if (success) {
    attempts.delete(key)
    return
  }
  const cur = attempts.get(key)
  if (!cur || cur.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS })
    return
  }
  cur.count += 1
}

export async function POST(request: Request) {
  const key = clientKey(request)
  if (isRateLimited(key)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in a few minutes." },
      { status: 429 },
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
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  const user = rows[0]

  if (!user || !user.passwordHash) {
    recordAttempt(key, false)
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    )
  }
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    recordAttempt(key, false)
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    )
  }

  recordAttempt(key, true)

  const sessionId = newSessionId()
  const ttlMs = getSessionTtlMs()
  const expiresAt = new Date(Date.now() + ttlMs)
  const ip = key === "unknown" ? null : key
  const ua = request.headers.get("user-agent") ?? null
  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
    userAgent: ua ? ua.slice(0, 250) : null,
    ip: ip ? ip.slice(0, 60) : null,
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
