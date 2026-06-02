import { existsSync, mkdirSync } from "node:fs"
import { dirname, isAbsolute, resolve } from "node:path"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { getServerEnv } from "@/lib/env"
import * as schema from "@/lib/db/schema"

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let dbInstance: DrizzleDb | null = null
let sqliteInstance: Database.Database | null = null

function resolveSqlitePath(url: string): string {
  const cleaned = url.startsWith("file:") ? url.slice(5) : url
  return isAbsolute(cleaned) ? cleaned : resolve(process.cwd(), cleaned)
}

export function getDb(): DrizzleDb {
  if (dbInstance) return dbInstance
  const { DATABASE_URL } = getServerEnv()
  const path = resolveSqlitePath(DATABASE_URL)
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  sqliteInstance = new Database(path)
  sqliteInstance.pragma("journal_mode = WAL")
  sqliteInstance.pragma("foreign_keys = ON")
  sqliteInstance.pragma("synchronous = NORMAL")

  dbInstance = drizzle(sqliteInstance, { schema })
  return dbInstance
}

export function closeDb() {
  if (sqliteInstance) {
    sqliteInstance.close()
    sqliteInstance = null
    dbInstance = null
  }
}

export const schemaTables = schema
