import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { sessions } from "@/lib/db/schema"
import {
  buildClearCookie,
  parseSessionCookie,
  verifySessionToken,
} from "@/lib/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie")
  const token = parseSessionCookie(cookieHeader)
  const verified = token ? verifySessionToken(token) : null
  if (verified) {
    try {
      const db = getDb()
      await db.delete(sessions).where(eq(sessions.id, verified.sessionId))
    } catch {
      // best-effort: cookie is still cleared below
    }
  }
  const res = NextResponse.json({ ok: true })
  res.headers.append("Set-Cookie", buildClearCookie())
  return res
}
