import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { sessions, users } from "@/lib/db/schema"
import {
  buildClearStateCookie,
  exchangeCodeForProfile,
  isGoogleConfigured,
  parseStateCookie,
  verifyOauthState,
} from "@/lib/auth/google"
import {
  buildSessionCookie,
  getSessionTtlMs,
  newSessionId,
  signSessionToken,
} from "@/lib/auth/session"
import { safeNextPath } from "@/lib/auth/safe-redirect"
import { getServerEnv } from "@/lib/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Google Sign-In is not configured." },
      { status: 503 },
    )
  }
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const stateCookie = parseStateCookie(request.headers.get("cookie"))
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=google_missing_code", url.origin),
      302,
    )
  }
  if (!state || !stateCookie) {
    return NextResponse.redirect(
      new URL("/login?error=google_state", url.origin),
      302,
    )
  }
  const [stateExpected, nextEncoded] = stateCookie.split("|")
  if (!stateExpected) {
    return NextResponse.redirect(
      new URL("/login?error=google_state", url.origin),
      302,
    )
  }
  if (!verifyOauthState(stateExpected, state)) {
    return NextResponse.redirect(
      new URL("/login?error=google_state_mismatch", url.origin),
      302,
    )
  }
  const next = safeNextPath(
    nextEncoded ? decodeURIComponent(nextEncoded) : "/ai-advisor",
  )

  let profile
  try {
    profile = await exchangeCodeForProfile(code)
  } catch (err) {
    console.error("[google-oauth] exchange failed:", err)
    return NextResponse.redirect(
      new URL("/login?error=google_exchange", url.origin),
      302,
    )
  }

  const db = getDb()
  const now = new Date()

  const bySub = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      role: users.role,
    })
    .from(users)
    .where(eq(users.googleSub, profile.sub))
    .limit(1)
  let user = bySub[0]

  if (!user) {
    const byEmail = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        plan: users.plan,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, profile.email))
      .limit(1)
    const existing = byEmail[0]
    if (existing) {
      await db
        .update(users)
        .set({
          googleSub: profile.sub,
          authProvider: "google",
          name: profile.name || existing.name,
          updatedAt: now,
        })
        .where(eq(users.id, existing.id))
      user = { ...existing, name: profile.name || existing.name }
    } else {
      const isAdmin = adminEmailsSet().has(profile.email)
      const id = crypto.randomUUID()
      await db.insert(users).values({
        id,
        email: profile.email,
        passwordHash: null,
        name: profile.name,
        plan: isAdmin ? "pro" : "free",
        role: isAdmin ? "admin" : "user",
        proSince: isAdmin ? now : null,
        googleSub: profile.sub,
        authProvider: "google",
      })
      user = {
        id,
        email: profile.email,
        name: profile.name,
        plan: isAdmin ? "pro" : "free",
        role: isAdmin ? "admin" : "user",
      }
    }
  }

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
    userId: user.id,
    expiresAt,
    userAgent: ua ? ua.slice(0, 250) : null,
    ip: ip ? ip.slice(0, 60) : null,
  })

  const token = signSessionToken(sessionId, user.id, ttlMs)
  const redirect = NextResponse.redirect(new URL(next, url.origin), 302)
  redirect.headers.append("Set-Cookie", buildSessionCookie(token, ttlMs))
  redirect.headers.append("Set-Cookie", buildClearStateCookie())
  return redirect
}

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
