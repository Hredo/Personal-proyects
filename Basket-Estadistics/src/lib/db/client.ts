import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { getServerEnv } from "@/lib/env"
import * as schema from "@/lib/db/schema"

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let dbInstance: DrizzleDb | null = null
let pgInstance: postgres.Sql | null = null

export function getDb(): DrizzleDb {
  if (dbInstance) return dbInstance
  const { DATABASE_URL } = getServerEnv()
  pgInstance = postgres(DATABASE_URL, { prepare: false })
  dbInstance = drizzle(pgInstance, { schema })
  return dbInstance
}

export function closeDb() {
  if (pgInstance) {
    try {
      pgInstance.end()
    } catch {
      // already closed
    }
    pgInstance = null
    dbInstance = null
  }
}

export const schemaTables = schema
