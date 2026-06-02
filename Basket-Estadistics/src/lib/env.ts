import { z } from "zod"

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("file:./data/basket.db")
  ),
  YOUTUBE_API_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional()
  ),
  CRON_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(16).optional()
  ),
})

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
})

const fullSchema = serverSchema.merge(clientSchema)

export type Env = z.infer<typeof fullSchema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) return cached
  const isClient = typeof window !== "undefined"
  const schema = isClient ? clientSchema : fullSchema
  const data: Record<string, string | undefined> = {}
  for (const key of Object.keys(schema.shape)) {
    data[key] = process.env[key]
  }
  const parsed = schema.parse(data)
  cached = parsed as Env
  return cached
}

export function getServerEnv() {
  return getEnv() as z.infer<typeof serverSchema>
}
