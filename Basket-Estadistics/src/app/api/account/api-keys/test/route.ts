import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getProvider, resolveModel } from "@/lib/ai/providers"
import { getDecryptedKey } from "@/lib/ai/user-provider"
import { chatComplete } from "@/lib/ai/chat"
import { clientIp, readRateLimit } from "@/lib/security/ai-advisor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  provider: z.string().trim().min(1).max(40),
  key: z.string().trim().min(8).max(400).optional(),
  model: z.string().trim().max(120).optional(),
})

export async function POST(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const limited = readRateLimit(clientIp(request), "account:test-key", 10, 0.2)
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many tests. Wait a few seconds." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid test request." },
      { status: 400 },
    )
  }
  const provider = getProvider(parsed.data.provider)
  if (!provider) {
    return NextResponse.json(
      { ok: false, error: "Unknown provider." },
      { status: 400 },
    )
  }

  // Prefer a freshly typed key (before saving); otherwise use the stored one.
  let apiKey: string | null = parsed.data.key ?? null
  if (provider.needsKey && !apiKey) {
    apiKey = await getDecryptedKey(user.id, provider.id)
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "No key saved for this provider yet." },
        { status: 400 },
      )
    }
  }

  const result = await chatComplete({
    provider,
    model: resolveModel(provider, parsed.data.model),
    apiKey,
    system: "You are a connectivity check. Answer with a single short word.",
    messages: [{ role: "user", content: "Reply with: OK" }],
    maxTokens: 5,
    temperature: 0,
  })

  if (result.ok) {
    return NextResponse.json({ ok: true, model: result.model })
  }
  return NextResponse.json({ ok: false, error: result.error })
}
