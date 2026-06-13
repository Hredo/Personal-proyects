import { NextResponse } from "next/server"
import { z } from "zod"
import { randomBytes } from "node:crypto"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { sendPasswordResetEmail } from "@/lib/auth/email"
import { clientIp } from "@/lib/security/ai-advisor"
import { consumeRateLimit } from "@/lib/security/rate-limit"
import { getEnv } from "@/lib/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  website: z.string().max(0).optional(),
})

export async function POST(request: Request) {
  const limited = await consumeRateLimit(
    `auth:forgot-password:${clientIp(request)}`,
    5,
    2 * 60 * 1000,
  )
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
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
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    )
  }
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }
  const { email } = parsed.data

  const db = getDb()
  const user = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (user.length === 0) {
    return NextResponse.json(
      { ok: true, message: "If an account exists, a reset link has been sent." },
      { status: 200 },
    )
  }

  const userId = user[0].id

  const resetToken = randomBytes(32).toString("hex")
  const tokenHash = await hashPassword(resetToken)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash,
    expiresAt,
  })

  const siteUrl = getEnv().NEXT_PUBLIC_SITE_URL
  const resetUrl = `${siteUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

  await sendPasswordResetEmail(email, resetUrl)

  return NextResponse.json(
    { ok: true, message: "If an account exists, a reset link has been sent." },
    { status: 200 },
  )
}
