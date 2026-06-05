import { sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"

export async function getLatestSyncTime(): Promise<Date | null> {
  try {
    const db = getDb()
    const rows = (await db.all(sql`
      select max(started_at) as last
      from sync_runs
      where status = 'ok'
    `)) as Array<{ last: number | null }>
    const last = rows[0]?.last
    if (last == null) return null
    const d = new Date(last * 1000)
    if (Number.isNaN(d.getTime())) return null
    return d
  } catch {
    return null
  }
}
