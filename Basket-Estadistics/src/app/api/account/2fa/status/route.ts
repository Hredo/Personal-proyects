import { NextResponse } from "next/server"
import { eq, and, count } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { users, twoFactorBackupCodes } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const sessionUser = await getCurrentUser(request.headers.get("cookie"))
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }

  const db = getDb()
  const userRows = await db
    .select({ twoFactorEnabled: users.twoFactorEnabled })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1)

  if (userRows.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const backupCountRow = await db
    .select({ count: count() })
    .from(twoFactorBackupCodes)
    .where(
      and(
        eq(twoFactorBackupCodes.userId, sessionUser.id),
        eq(twoFactorBackupCodes.used, false),
      ),
    )

  return NextResponse.json({
    twoFactorEnabled: userRows[0].twoFactorEnabled,
    remainingBackupCodes: backupCountRow[0]?.count ?? 0,
  })
}
