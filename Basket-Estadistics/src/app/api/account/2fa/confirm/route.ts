import { NextResponse } from "next/server"
import { z } from "zod"
import { randomBytes } from "node:crypto"
import { eq, and, gt } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import {
  users,
  twoFactorSessions,
  twoFactorBackupCodes,
} from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { clientIp, readRateLimit } from "@/lib/security/ai-advisor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  sessionId: z.string().uuid(),
  code: z.string().min(6).max(6),
})

export async function POST(request: Request) {
  const sessionUser = await getCurrentUser(request.headers.get("cookie"))
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const limited = readRateLimit(clientIp(request), "account:2fa-confirm", 5, 0.05)
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
    return NextResponse.json(
      { error: "Invalid verification data." },
      { status: 400 },
    )
  }
  const { sessionId, code } = parsed.data

  const db = getDb()
  const now = new Date()

  const tfaRows = await db
    .select({
      id: twoFactorSessions.id,
      codeHash: twoFactorSessions.codeHash,
      attempts: twoFactorSessions.attempts,
    })
    .from(twoFactorSessions)
    .where(
      and(
        eq(twoFactorSessions.id, sessionId),
        eq(twoFactorSessions.userId, sessionUser.id),
        gt(twoFactorSessions.expiresAt, now),
      ),
    )
    .limit(1)

  if (tfaRows.length === 0) {
    return NextResponse.json(
      { error: "Verification session expired or invalid. Please try again." },
      { status: 400 },
    )
  }

  const tfa = tfaRows[0]

  if (tfa.attempts >= 5) {
    await db.delete(twoFactorSessions).where(eq(twoFactorSessions.id, sessionId))
    return NextResponse.json(
      { error: "Too many incorrect attempts. Please start over." },
      { status: 429 },
    )
  }

  await db
    .update(twoFactorSessions)
    .set({ attempts: tfa.attempts + 1 })
    .where(eq(twoFactorSessions.id, sessionId))

  const valid = await verifyPassword(code, tfa.codeHash)
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid verification code." },
      { status: 400 },
    )
  }

  await db
    .update(users)
    .set({ twoFactorEnabled: true, updatedAt: new Date() })
    .where(eq(users.id, sessionUser.id))

  await db
    .delete(twoFactorSessions)
    .where(eq(twoFactorSessions.id, sessionId))

  const backupCodes: string[] = []
  const backupCodeHashes: { codeHash: string }[] = []
  for (let i = 0; i < 8; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase()
    backupCodes.push(code)
    const codeHash = await hashPassword(code)
    backupCodeHashes.push({ codeHash })
  }

  if (backupCodeHashes.length > 0) {
    await db.insert(twoFactorBackupCodes).values(
      backupCodeHashes.map((h) => ({
        userId: sessionUser.id,
        codeHash: h.codeHash,
      })),
    )
  }

  return NextResponse.json({
    ok: true,
    message: "Two-factor authentication enabled.",
    backupCodes,
  })
}
