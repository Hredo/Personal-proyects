/**
 * Server-side resolution of "which AI engine does THIS user want for THIS
 * feature", plus small read helpers over user_settings / user_api_keys.
 *
 * The advisor/compare routes call resolveEngine() to decide whether they can
 * run an LLM (and with which key) or must tell the user to configure one.
 */
import { and, eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { userApiKeys, userSettings } from "@/lib/db/schema"
import {
  getProvider,
  resolveModel,
  type AiFeature,
  type AiProvider,
} from "@/lib/ai/providers"
import { decryptSecret } from "@/lib/security/secrets"

export type UserSettingsView = {
  advisorProvider: string | null
  advisorModel: string | null
  compareProvider: string | null
  compareModel: string | null
  locale: string
  emailProduct: boolean
  emailUsage: boolean
  reduceMotion: boolean
}

export const DEFAULT_SETTINGS: UserSettingsView = {
  advisorProvider: null,
  advisorModel: null,
  compareProvider: null,
  compareModel: null,
  locale: "en",
  emailProduct: true,
  emailUsage: false,
  reduceMotion: false,
}

export async function getUserSettings(
  userId: string,
): Promise<UserSettingsView> {
  const db = getDb()
  const rows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)
  const row = rows[0]
  if (!row) return { ...DEFAULT_SETTINGS }
  return {
    advisorProvider: row.advisorProvider,
    advisorModel: row.advisorModel,
    compareProvider: row.compareProvider,
    compareModel: row.compareModel,
    locale: row.locale,
    emailProduct: row.emailProduct,
    emailUsage: row.emailUsage,
    reduceMotion: row.reduceMotion,
  }
}

export type KeyStatus = {
  provider: string
  last4: string
  label: string | null
  updatedAt: string
}

export async function listKeyStatuses(userId: string): Promise<KeyStatus[]> {
  const db = getDb()
  const rows = await db
    .select({
      provider: userApiKeys.provider,
      last4: userApiKeys.last4,
      label: userApiKeys.label,
      updatedAt: userApiKeys.updatedAt,
    })
    .from(userApiKeys)
    .where(eq(userApiKeys.userId, userId))
  return rows.map((r) => ({
    provider: r.provider,
    last4: r.last4,
    label: r.label,
    updatedAt: r.updatedAt.toISOString(),
  }))
}

export async function getDecryptedKey(
  userId: string,
  providerId: string,
): Promise<string | null> {
  const db = getDb()
  const rows = await db
    .select({ encryptedKey: userApiKeys.encryptedKey })
    .from(userApiKeys)
    .where(
      and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, providerId)),
    )
    .limit(1)
  const row = rows[0]
  if (!row) return null
  return decryptSecret(row.encryptedKey)
}

export type ResolvedEngine =
  | {
      ok: true
      provider: AiProvider
      model: string
      apiKey: string | null
    }
  | {
      ok: false
      reason: "not_selected" | "unknown_provider" | "no_key" | "decrypt_failed"
      providerId?: string
    }

export async function resolveEngine(
  userId: string,
  feature: AiFeature,
): Promise<ResolvedEngine> {
  const settings = await getUserSettings(userId)
  const providerId =
    feature === "advisor" ? settings.advisorProvider : settings.compareProvider
  const modelPref =
    feature === "advisor" ? settings.advisorModel : settings.compareModel

  if (!providerId) return { ok: false, reason: "not_selected" }
  const provider = getProvider(providerId)
  if (!provider) return { ok: false, reason: "unknown_provider", providerId }

  const model = resolveModel(provider, modelPref)

  if (!provider.needsKey) {
    return { ok: true, provider, model, apiKey: null }
  }

  const apiKey = await getDecryptedKey(userId, providerId)
  if (!apiKey) {
    // A row may exist but fail to decrypt after a secret rotation.
    const db = getDb()
    const exists = await db
      .select({ id: userApiKeys.id })
      .from(userApiKeys)
      .where(eq(userApiKeys.userId, userId))
    const hasRow = exists.length > 0
    return {
      ok: false,
      reason: hasRow ? "decrypt_failed" : "no_key",
      providerId,
    }
  }
  return { ok: true, provider, model, apiKey }
}
