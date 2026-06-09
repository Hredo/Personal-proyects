import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"
import { verifyPassword } from "@/lib/auth/password"
import { buildClearCookie } from "@/lib/auth/session"
import { clientIp, readRateLimit } from "@/lib/security/ai-advisor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  password: z.string().min(1).max(200),
})

export async function DELETE(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const limited = readRateLimit(clientIp(request), "account:delete", 5, 0.05)
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
    return NextResponse.json({ error: "Password required." }, { status: 400 })
  }

  const db = getDb()
  const rows = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)
  const hash = rows[0]?.passwordHash
  if (hash) {
    const valid = await verifyPassword(parsed.data.password, hash)
    if (!valid) {
      return NextResponse.json(
        { error: "Your password is incorrect." },
        { status: 400 },
      )
    }
  }

  // Cascades remove sessions, conversations, messages, api keys, settings and
  // compare uses (all FK ON DELETE CASCADE to users).
  await db.delete(users).where(eq(users.id, user.id))

  const res = NextResponse.json({ ok: true })
  res.headers.append("Set-Cookie", buildClearCookie())
  return res
}
