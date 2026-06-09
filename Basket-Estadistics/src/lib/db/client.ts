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

/**
 * Idempotently ensure the account tables/columns exist. Mirrors setupFts: all
 * statements are additive and safe to re-run, so the schema self-heals on boot
 * without drizzle-kit (whose interactive push prompt conflicts with the FTS
 * virtual table in non-TTY environments).
 */
function ensureAccountSchema(raw: Database.Database): void {
  const userCols = raw
    .prepare<[], { name: string }>("PRAGMA table_info(users)")
    .all()
  if (userCols.length > 0) {
    const has = (c: string) => userCols.some((col) => col.name === c)
    if (!has("stripe_customer_id"))
      raw.exec("ALTER TABLE users ADD COLUMN stripe_customer_id text")
    if (!has("stripe_subscription_id"))
      raw.exec("ALTER TABLE users ADD COLUMN stripe_subscription_id text")
    if (!has("plan_renews_at"))
      raw.exec("ALTER TABLE users ADD COLUMN plan_renews_at integer")
  }
  raw.exec(`
    CREATE TABLE IF NOT EXISTS user_api_keys (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider text NOT NULL,
      encrypted_key text NOT NULL,
      last4 text NOT NULL,
      label text,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS user_api_keys_user_provider_idx
      ON user_api_keys (user_id, provider);
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id text PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      advisor_provider text,
      advisor_model text,
      compare_provider text,
      compare_model text,
      locale text DEFAULT 'en' NOT NULL,
      email_product integer DEFAULT 1 NOT NULL,
      email_usage integer DEFAULT 0 NOT NULL,
      reduce_motion integer DEFAULT 0 NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    );
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

  try {
    ensureAccountSchema(sqliteInstance)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[db] account schema setup skipped: ${message}`)
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
