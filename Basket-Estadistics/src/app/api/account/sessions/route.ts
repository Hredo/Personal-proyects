import { NextResponse } from "next/server"
import { and, desc, eq, ne } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { sessions } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"
import { parseSessionCookie, verifySessionToken } from "@/lib/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function currentSessionId(request: Request): string | null {
  const token = parseSessionCookie(request.headers.get("cookie"))
  const verified = token ? verifySessionToken(token) : null
  return verified?.sessionId ?? null
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const db = getDb()
  const rows = await db
    .select({
      id: sessions.id,
      userAgent: sessions.userAgent,
      ip: sessions.ip,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.createdAt))
    .limit(50)

  const current = currentSessionId(request)
  return NextResponse.json({
    sessions: rows.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ip: s.ip,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      current: s.id === current,
    })),
  })
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const db = getDb()
  const current = currentSessionId(request)
  const url = new URL(request.url)
  const id = url.searchParams.get("id")

  if (id) {
    // Revoke a single session. Refuse to kill the current one here — that's
    // what "Sign out" is for.
    if (id === current) {
      return NextResponse.json(
        { error: "Use sign out to end your current session." },
        { status: 400 },
      )
    }
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, user.id), eq(sessions.id, id)))
    return NextResponse.json({ ok: true })
  }

  // No id → revoke every other session (keep the current one).
  if (current) {
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, user.id), ne(sessions.id, current)))
  }
  return NextResponse.json({ ok: true })
}
