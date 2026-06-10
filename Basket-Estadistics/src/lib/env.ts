import { z } from "zod"

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v

// Dev-only fallback so local auth works out of the box. Production refuses to
// boot with this value (see assertProductionSecrets) — set a real secret there.
const DEV_SESSION_SECRET = "dev-only-insecure-session-secret-change-me-please"

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().min(1, "DATABASE_URL is required"),
  ),
  SESSION_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(32).default(DEV_SESSION_SECRET),
  ),
  SESSION_TTL_DAYS: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(365).default(30),
  ),
  // Dedicated key for encrypting user-provided AI credentials at rest.
  // Optional in dev (a key is derived from SESSION_SECRET); set a strong,
  // unique value in production so rotating the session secret never exposes keys.
  ENCRYPTION_KEY: z.preprocess(emptyToUndefined, z.string().min(32).optional()),
  ADMIN_EMAILS: z.preprocess(emptyToUndefined, z.string().optional()),
  HUGGINGFACE_API_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  HUGGINGFACE_RERANK_MODEL: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  CRON_SECRET: z.preprocess(emptyToUndefined, z.string().min(16).optional()),
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
  if (!isClient) assertProductionSecrets(parsed as Env)
  cached = parsed as Env
  return cached
}

function assertProductionSecrets(env: Env): void {
  if (env.NODE_ENV !== "production") return
  if (env.SESSION_SECRET === DEV_SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET must be set to a strong, unique value (>=32 chars) in production.",
    )
  }
}

export function getServerEnv() {
  return getEnv() as z.infer<typeof serverSchema>
}
