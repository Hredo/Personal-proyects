import { NextResponse } from "next/server"
import { z } from "zod"
import { getDb } from "@/lib/db/client"
import { userSettings } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"
import {
  getProvider,
  resolveModel,
  type AiFeature,
} from "@/lib/ai/providers"
import { getUserSettings } from "@/lib/ai/user-provider"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const settings = await getUserSettings(user.id)
  return NextResponse.json({ settings })
}

const putSchema = z.object({
  advisorProvider: z.string().trim().max(40).nullable().optional(),
  advisorModel: z.string().trim().max(120).nullable().optional(),
  compareProvider: z.string().trim().max(40).nullable().optional(),
  compareModel: z.string().trim().max(120).nullable().optional(),
  locale: z.enum(["en", "es"]).optional(),
  emailProduct: z.boolean().optional(),
  emailUsage: z.boolean().optional(),
  reduceMotion: z.boolean().optional(),
})

/** Validate a provider/model pair for a feature; null = cleared. */
function normalizePair(
  providerId: string | null,
  model: string | null,
  feature: AiFeature,
): { providerId: string | null; model: string | null } | "invalid" {
  if (!providerId) return { providerId: null, model: null }
  const provider = getProvider(providerId)
  if (!provider) return "invalid"
  const supported =
    feature === "advisor" ? provider.supportsAdvisor : provider.supportsCompare
  if (!supported) return "invalid"
  return { providerId: provider.id, model: resolveModel(provider, model) }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings." }, { status: 400 })
  }
  const patch = parsed.data
  const current = await getUserSettings(user.id)

  const next = {
    advisorProvider: current.advisorProvider,
    advisorModel: current.advisorModel,
    compareProvider: current.compareProvider,
    compareModel: current.compareModel,
    locale: current.locale,
    emailProduct: current.emailProduct,
    emailUsage: current.emailUsage,
    reduceMotion: current.reduceMotion,
  }

  if (patch.advisorProvider !== undefined || patch.advisorModel !== undefined) {
    const providerId =
      patch.advisorProvider !== undefined
        ? patch.advisorProvider
        : next.advisorProvider
    const model =
      patch.advisorModel !== undefined ? patch.advisorModel : next.advisorModel
    const norm = normalizePair(providerId, model, "advisor")
    if (norm === "invalid") {
      return NextResponse.json(
        { error: "That provider can't power the AI Advisor." },
        { status: 400 },
      )
    }
    next.advisorProvider = norm.providerId
    next.advisorModel = norm.model
  }

  if (patch.compareProvider !== undefined || patch.compareModel !== undefined) {
    const providerId =
      patch.compareProvider !== undefined
        ? patch.compareProvider
        : next.compareProvider
    const model =
      patch.compareModel !== undefined ? patch.compareModel : next.compareModel
    const norm = normalizePair(providerId, model, "compare")
    if (norm === "invalid") {
      return NextResponse.json(
        { error: "That provider can't power AI Compare." },
        { status: 400 },
      )
    }
    next.compareProvider = norm.providerId
    next.compareModel = norm.model
  }

  if (patch.locale !== undefined) next.locale = patch.locale
  if (patch.emailProduct !== undefined) next.emailProduct = patch.emailProduct
  if (patch.emailUsage !== undefined) next.emailUsage = patch.emailUsage
  if (patch.reduceMotion !== undefined) next.reduceMotion = patch.reduceMotion

  const db = getDb()
  const now = new Date()
  await db
    .insert(userSettings)
    .values({ userId: user.id, ...next, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { ...next, updatedAt: now },
    })

  return NextResponse.json({ ok: true, settings: next })
}
