import { NextResponse } from "next/server"
import { desc } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { syncRuns } from "@/lib/db/schema"
import { getCurrentUser, isAdmin } from "@/lib/auth/current-user"

export async function GET(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const db = getDb()
  const rows = await db
    .select()
    .from(syncRuns)
    .orderBy(desc(syncRuns.startedAt))
    .limit(50)

  return NextResponse.json(rows)
}
