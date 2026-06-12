import { sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"

export async function setRLSUserContext(userId: string, role: string): Promise<void> {
  const db = getDb()
  await db.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`)
  await db.execute(sql`SELECT set_config('app.user_role', ${role}, true)`)
}

export async function resetRLSUserContext(): Promise<void> {
  const db = getDb()
  await db.execute(
    sql`SELECT set_config('app.current_user_id', 'anonymous', true), set_config('app.user_role', 'anonymous', true)`,
  )
}
