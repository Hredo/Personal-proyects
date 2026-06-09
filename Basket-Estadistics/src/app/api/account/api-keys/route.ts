import { NextResponse } from "next/server"
import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { userApiKeys, userSettings } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getProvider } from "@/lib/ai/providers"
import {
  getUserSettings,
  listKeyStatuses,
} from "@/lib/ai/user-provider"
import { encryptSecret, last4 } from "@/lib/security/secrets"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const [keys, settings] = await Promise.all([
    listKeyStatuses(user.id),
    getUserSettings(user.id),
  ])
  return NextResponse.json({ keys, settings })
}

const putSchema = z.object({
  provider: z.string().trim().min(1).max(40),
  key: z.string().trim().min(8).max(400),
  label: z.string().trim().max(60).optional(),
})

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
    return NextResponse.json({ error: "Invalid key data." }, { status: 400 })
  }
  const provider = getProvider(parsed.data.provider)
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 400 })
  }
  if (!provider.needsKey) {
    return NextResponse.json(
      { error: `${provider.name} runs locally and needs no API key.` },
      { status: 400 },
    )
  }

  const key = parsed.data.key
  const now = new Date()
  const db = getDb()
  await db
    .insert(userApiKeys)
    .values({
      userId: user.id,
      provider: provider.id,
      encryptedKey: encryptSecret(key),
      last4: last4(key),
      label: parsed.data.label ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [userApiKeys.userId, userApiKeys.provider],
      set: {
        encryptedKey: encryptSecret(key),
        last4: last4(key),
        label: parsed.data.label ?? null,
        updatedAt: now,
      },
    })

  return NextResponse.json({
    ok: true,
    provider: provider.id,
    last4: last4(key),
  })
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const url = new URL(request.url)
  const provider = url.searchParams.get("provider")
  if (!provider) {
    return NextResponse.json({ error: "Missing provider." }, { status: 400 })
  }
  const db = getDb()
  await db
    .delete(userApiKeys)
    .where(
      and(eq(userApiKeys.userId, user.id), eq(userApiKeys.provider, provider)),
    )

  // Clear any feature that pointed at this provider so the picker doesn't
  // reference a credential that no longer exists.
  const settings = await getUserSettings(user.id)
  const patch: Record<string, unknown> = {}
  if (settings.advisorProvider === provider) {
    patch.advisorProvider = null
    patch.advisorModel = null
  }
  if (settings.compareProvider === provider) {
    patch.compareProvider = null
    patch.compareModel = null
  }
  if (Object.keys(patch).length > 0) {
    patch.updatedAt = new Date()
    await db
      .update(userSettings)
      .set(patch)
      .where(eq(userSettings.userId, user.id))
  }

  return NextResponse.json({ ok: true })
}
