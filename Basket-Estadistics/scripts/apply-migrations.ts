import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { getDb, closeDb } from "../src/lib/db/client"

const db = getDb()

migrate(db, { migrationsFolder: "./drizzle" })

console.log("Migrations applied")
closeDb()
