import { sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"

export async function getLatestSyncTime(): Promise<Date | null> {
  try {
    const db = getDb()
    const rows = (await db.execute(sql`
      select max(started_at) as last
      from sync_runs
      where status = 'ok'
    `)) as Array<{ last: Date | null }>
    const last = rows[0]?.last
    if (last == null) return null
    return last instanceof Date ? last : new Date(last)
  } catch {
    return null
  }
}
