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

function setupFts(raw: Database.Database): void {
  raw.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS players_fts USING fts5(
      full_name,
      nationality,
      tokenize = "unicode61 remove_diacritics 2"
    );

    CREATE TRIGGER IF NOT EXISTS players_fts_ai AFTER INSERT ON players BEGIN
      INSERT INTO players_fts(rowid, full_name, nationality)
      VALUES (new.rowid, new.full_name, COALESCE(new.nationality, ''));
    END;
    CREATE TRIGGER IF NOT EXISTS players_fts_ad AFTER DELETE ON players BEGIN
      DELETE FROM players_fts WHERE rowid = old.rowid;
    END;
    CREATE TRIGGER IF NOT EXISTS players_fts_au AFTER UPDATE ON players BEGIN
      DELETE FROM players_fts WHERE rowid = old.rowid;
      INSERT INTO players_fts(rowid, full_name, nationality)
      VALUES (new.rowid, new.full_name, COALESCE(new.nationality, ''));
    END;
  `)
}

function ensureFtsBackfilled(raw: Database.Database): void {
  const populated = raw
    .prepare<[], { c: number }>("SELECT count(*) as c FROM players_fts")
    .get()
  const live = raw
    .prepare<[], { c: number }>("SELECT count(*) as c FROM players")
    .get()
  if (!populated || !live) return
  if (Number(populated.c) === 0 && Number(live.c) > 0) {
    raw.exec(
      "INSERT INTO players_fts(rowid, full_name, nationality) SELECT rowid, full_name, COALESCE(nationality, '') FROM players",
    )
  }
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

  try {
    setupFts(sqliteInstance)
    ensureFtsBackfilled(sqliteInstance)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[db] FTS5 setup skipped: ${message}`)
  }

  dbInstance = drizzle(sqliteInstance, { schema })
  return dbInstance
}

export function closeDb() {
  if (sqliteInstance) {
    try {
      sqliteInstance.close()
    } catch {
      // already closed or otherwise unavailable — treat as a no-op
    }
    sqliteInstance = null
    dbInstance = null
  }
}

export const schemaTables = schema
