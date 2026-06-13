import { NextResponse } from "next/server"
import { z } from "zod"
import { getDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  hashPassword,
  isStrongPassword,
} from "@/lib/auth/password"
import {
  buildSessionCookie,
  getSessionTtlMs,
  newSessionId,
  signSessionToken,
} from "@/lib/auth/session"
import { sessions } from "@/lib/db/schema"
import { getServerEnv } from "@/lib/env"
import { clientIp } from "@/lib/security/ai-advisor"
import { consumeRateLimit } from "@/lib/security/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(2).max(60),
  website: z.string().max(0).optional(),
})

function adminEmailsSet(): Set<string> {
  const raw = getServerEnv().ADMIN_EMAILS
  if (!raw) return new Set()
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
}

export async function POST(request: Request) {
  // Rate limit account creation per IP (burst 5, ~1 per 20s) to curb
  // signup spam and slow down email-enumeration probing.
  const limited = await consumeRateLimit(
    `auth:register:${clientIp(request)}`,
    5,
    2 * 60 * 1000,
  )
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
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
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration data.", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { email, password, name } = parsed.data
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }
  if (!isStrongPassword(password)) {
    return NextResponse.json(
      {
        error:
          "Password must be at least 8 characters and include uppercase, lowercase and a digit.",
      },
      { status: 400 },
    )
  }

  const db = getDb()
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    )
  }

  const passwordHash = await hashPassword(password)
  const isAdmin = adminEmailsSet().has(email)
  const id = crypto.randomUUID()

  await db.insert(users).values({
    id,
    email,
    passwordHash,
    name,
    plan: isAdmin ? "pro" : "free",
    role: isAdmin ? "admin" : "user",
    proSince: isAdmin ? new Date() : null,
  })

  const sessionId = newSessionId()
  const ttlMs = getSessionTtlMs()
  const expiresAt = new Date(Date.now() + ttlMs)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  const ua = request.headers.get("user-agent") ?? null
  await db.insert(sessions).values({
    id: sessionId,
    userId: id,
    expiresAt,
    userAgent: ua ? ua.slice(0, 250) : null,
    ip: ip ? ip.slice(0, 60) : null,
  })

  const token = signSessionToken(sessionId, id, ttlMs)
  const res = NextResponse.json({
    ok: true,
    user: { id, email, name, plan: isAdmin ? "pro" : "free", role: isAdmin ? "admin" : "user" },
  })
  res.headers.append("Set-Cookie", buildSessionCookie(token, ttlMs))
  return res
}
