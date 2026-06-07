import Database from "better-sqlite3"
import { resolve } from "node:path"

const dbPath = resolve(process.cwd(), "data/basket.db")
const db = new Database(dbPath, { readonly: true })
const cols = db
  .prepare<[], { name: string; type: string; notnull: number; dflt_value: string | null }>(
    "PRAGMA table_info(users)",
  )
  .all()
console.log("users columns:")
for (const c of cols) {
  console.log(`  ${c.name} ${c.type}${c.notnull ? " NOT NULL" : ""}${c.dflt_value ? ` DEFAULT ${c.dflt_value}` : ""}`)
}
db.close()
