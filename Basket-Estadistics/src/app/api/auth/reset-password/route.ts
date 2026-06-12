import { NextResponse } from "next/server"
import { z } from "zod"
import { eq, and, gt } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { users, passwordResetTokens } from "@/lib/db/schema"
import {
  hashPassword,
  isStrongPassword,
  verifyPassword,
} from "@/lib/auth/password"
import { clientIp, readRateLimit } from "@/lib/security/ai-advisor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  token: z.string().min(1).max(128),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
})

export async function POST(request: Request) {
  const limited = readRateLimit(clientIp(request), "auth:reset-password", 5, 0.05)
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
      { error: "Invalid reset data." },
      { status: 400 },
    )
  }
  const { token, email, password } = parsed.data

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
  const now = new Date()

  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (userRows.length === 0) {
    return NextResponse.json(
      { error: "Invalid or expired reset link." },
      { status: 400 },
    )
  }
  const userId = userRows[0].id

  const tokenRows = await db
    .select({
      id: passwordResetTokens.id,
      tokenHash: passwordResetTokens.tokenHash,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .orderBy(passwordResetTokens.createdAt)
    .limit(5)

  let matchedTokenId: string | null = null
  for (const row of tokenRows) {
    const valid = await verifyPassword(token, row.tokenHash)
    if (valid) {
      matchedTokenId = row.id
      break
    }
  }

  if (!matchedTokenId) {
    return NextResponse.json(
      { error: "Invalid or expired reset link." },
      { status: 400 },
    )
  }

  const newHash = await hashPassword(password)
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, userId))

  await db
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, matchedTokenId))

  await db
    .delete(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        eq(passwordResetTokens.used, true),
      ),
    )

  return NextResponse.json({
    ok: true,
    message: "Password has been reset successfully. You can now sign in.",
  })
}
