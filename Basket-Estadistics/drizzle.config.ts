import { defineConfig } from "drizzle-kit"
import { isAbsolute, resolve } from "node:path"

const raw = process.env.DATABASE_URL ?? "file:./data/basket.db"
const url = raw.startsWith("file:") ? raw.slice(5) : raw
const absolute = isAbsolute(url) ? url : resolve(process.cwd(), url)

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: absolute,
  },
  strict: true,
  verbose: true,
})
