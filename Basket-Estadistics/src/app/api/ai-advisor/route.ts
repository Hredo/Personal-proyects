import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { conversations, messages } from "@/lib/db/schema"
import { getTeamBySlug } from "@/lib/data/teams"
import {
  buildLocalAdvice,
  findPlayerInQuery,
  type AdvisorOutput,
} from "@/lib/ai/local-advisor"
import { generateAdvisorResponse, lastLlmError } from "@/lib/ai/llm"
import { resolveEngine } from "@/lib/ai/user-provider"
import { getProvider, resolveModel } from "@/lib/ai/providers"
import { getCurrentUser } from "@/lib/auth/current-user"
// NOTE: Import kept for when usage limits are re-enabled.
// import { getAdvisorFreeUsage } from "@/lib/auth/free-usage"
// import { userPlan } from "@/lib/db/schema"
import {
  audit,
  clientIp,
  cleanLlmOutput,
  cleanUserText,
  detectInjection,
  jsonError,
  MAX_HISTORY_MESSAGE_LEN,
  MAX_HISTORY_MESSAGES,
  MAX_USER_MESSAGE_LEN,
  rateLimit,
  securityHeaders,
} from "@/lib/security/ai-advisor"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export type AdvisorRequest = {
  teamSlug: string
  leagueSlug: string
  userMessage: string
  history?: Array<{ role: "user" | "assistant"; content: string }>
  conversationId?: string
  conversationTitle?: string
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  // 0. Auth — middleware already gates this but defense in depth.
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return jsonError("Authentication required.", 401)
  }
  // NOTE: plan check disabled until re-enabled later.
  // const plan = userPlan(user)

  // 1. Rate limit per IP.
  const limit = rateLimit(ip)
  if (!limit.ok) {
    audit("rate-limit", { ip, retryAfterSec: limit.retryAfterSec })
    return new NextResponse(
      JSON.stringify({
        content: `Too many requests. Try again in ${limit.retryAfterSec}s.`,
        error: true,
      }),
      {
        status: 429,
        headers: securityHeaders({
          "Retry-After": String(limit.retryAfterSec),
        }),
      },
    )
  }

  // 2. Content-Type guard.
  const ct = request.headers.get("content-type") ?? ""
  if (!ct.toLowerCase().includes("application/json")) {
    audit("bad-content-type", { ip, ct })
    return jsonError("Unsupported content type.", 415)
  }

  // 3. Body size cap (defence in depth on top of Next's own limits).
  const rawLen = Number(request.headers.get("content-length") ?? 0)
  if (Number.isFinite(rawLen) && rawLen > 0 && rawLen > 64 * 1024) {
    audit("oversized-body", { ip, bytes: rawLen })
    return jsonError("Request too large.", 413)
  }

  // 4. Origin / referer check (same-origin only).
  const expectedHost = request.headers.get("host")
  const sameOrigin =
    origin && expectedHost
      ? (() => {
          try {
            return new URL(origin).host === expectedHost
          } catch {
            return false
          }
        })()
      : true
  const refererOk = !referer
    ? true
    : (() => {
        try {
          return new URL(referer).host === expectedHost
        } catch {
          return false
        }
      })()
  if (!sameOrigin || !refererOk) {
    audit("cross-origin-blocked", {
      ip,
      origin,
      referer,
      expectedHost,
      sameOrigin,
      refererOk,
    })
    return jsonError("Origin not allowed.", 403)
  }

  // 5. Parse body.
  let body: AdvisorRequest
  try {
    body = (await request.json()) as AdvisorRequest
  } catch {
    audit("invalid-json", { ip })
    return jsonError("Invalid JSON.", 400)
  }

  // 5b. Resolve / create conversation for this user.
  const db = getDb()
  let conversationId: string | null =
    typeof body.conversationId === "string" && body.conversationId.length <= 60
      ? body.conversationId
      : null
  let conversationTitle: string | null = null
  if (conversationId) {
    const rows = await db
      .select({
        id: conversations.id,
        userId: conversations.userId,
        title: conversations.title,
      })
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, user.id),
        ),
      )
      .limit(1)
    if (rows.length === 0) {
      return jsonError("Conversation not found.", 404)
    }
  } else {
    // NOTE: Free quota check disabled until re-enabled later.
    // if (plan === "free") {
    //   const usage = await getAdvisorFreeUsage(user.id, user.plan, user.role)
    //   if (usage.remaining <= 0) {
    //     return NextResponse.json(
    //       {
    //         error: "free_quota_exceeded",
    //         message:
    //           "You used your free advisor preview. Upgrade to Pro for unlimited conversations.",
    //       },
    //       { status: 403, headers: securityHeaders() },
    //     )
    //   }
    // }
    conversationId = crypto.randomUUID()
    const rawTitle =
      typeof body.conversationTitle === "string"
        ? body.conversationTitle.trim().slice(0, 160)
        : ""
    conversationTitle =
      rawTitle.length > 0
        ? rawTitle
        : `${body.teamSlug} - ${cleanUserText(body.userMessage).slice(0, 60)}`
  }

  // 6. Required fields.
  if (
    !body ||
    typeof body.teamSlug !== "string" ||
    typeof body.leagueSlug !== "string" ||
    typeof body.userMessage !== "string"
  ) {
    audit("missing-fields", { ip })
    return jsonError("Missing team or question data.", 400)
  }
  if (!body.teamSlug.trim() || !body.leagueSlug.trim()) {
    return jsonError("Invalid team or league.", 400)
  }

  // 7. Sanitise and bound user input.
  const userMessage = cleanUserText(body.userMessage).slice(
    0,
    MAX_USER_MESSAGE_LEN,
  )
  if (userMessage.length === 0) {
    return jsonError("The question cannot be empty.", 400)
  }

  // 8. Prompt-injection detection.
  const findings = detectInjection(userMessage)
  if (findings.length > 0) {
    audit("prompt-injection-blocked", {
      ip,
      findings: findings.slice(0, 5),
      sample: userMessage.slice(0, 120),
    })
    return jsonError(
      "Your message contains patterns that are not allowed. Rephrase it as a normal scouting question.",
      400,
    )
  }

  // 9. History sanitisation / cap.
  const rawHistory = Array.isArray(body.history) ? body.history : []
  if (rawHistory.length > MAX_HISTORY_MESSAGES * 4) {
    audit("oversized-history", { ip, len: rawHistory.length })
  }
  const history = rawHistory
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: cleanUserText(m.content).slice(0, MAX_HISTORY_MESSAGE_LEN),
    }))

  // 10. Team lookup (also acts as authn-ish gate: only valid teams get LLM).
  let team
  try {
    team = await getTeamBySlug(body.leagueSlug, body.teamSlug)
  } catch (err) {
    audit("team-lookup-error", { ip, err: String(err) })
    return jsonError("Failed to load team.", 500)
  }
  if (!team) {
    return NextResponse.json(
      { content: `Team not found in ${body.leagueSlug}.` },
      { headers: securityHeaders() },
    )
  }

  // 10b. Persist the new conversation (if not already existing).
  if (conversationTitle) {
    try {
      await db.insert(conversations).values({
        id: conversationId!,
        userId: user.id,
        teamSlug: body.teamSlug,
        teamName: team.name,
        leagueSlug: body.leagueSlug,
        title: conversationTitle,
      })
    } catch (err) {
      audit("conversation-insert-failed", { ip, err: String(err) })
      return jsonError("Failed to start conversation.", 500)
    }
  }

  // 10c. Insert user message into conversation.
  try {
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId: conversationId!,
      role: "user",
      content: userMessage,
    })
  } catch (err) {
    audit("message-insert-failed", { ip, err: String(err) })
  }

  // 11. Optional: find player profile for richer context.
  let playerProfile = null
  try {
    playerProfile = await findPlayerInQuery(userMessage)
  } catch (err) {
    audit("player-lookup-error", { ip, err: String(err) })
  }

  // 12. LLM call. Use the engine the user configured for the advisor (a cloud
  // provider with their own key, or a local Ollama). Back-compat: an explicit
  // `X-User-LLM: ollama` header forces Ollama even before the user has picked a
  // provider in their account. If no engine is available we fall back to the
  // deterministic rule-based advisor and flag `aiConfigured: false` so the UI
  // can nudge the user to connect an AI.
  let engine = await resolveEngine(user.id, "advisor")
  if (!engine.ok && request.headers.get("x-user-llm") === "ollama") {
    const ollama = getProvider("ollama")
    if (ollama) {
      engine = {
        ok: true,
        provider: ollama,
        model: resolveModel(ollama, process.env.OLLAMA_MODEL),
        apiKey: null,
      }
    }
  }

  let aiReason: string | null = engine.ok ? null : engine.reason
  if (engine.ok) {
    try {
      const llm = await generateAdvisorResponse(
        { team, userMessage, history, playerProfile },
        {
          provider: engine.provider,
          model: engine.model,
          apiKey: engine.apiKey,
        },
      )
      if (llm) {
        const safe = cleanLlmOutput(llm.content)
        await persistAssistant(db, conversationId!, safe, llm.model, "llm")
        return NextResponse.json(
          {
            content: safe,
            model: llm.model,
            provider: engine.provider.id,
            mode: "llm" as const,
            conversationId,
          },
          { headers: securityHeaders() },
        )
      }
      aiReason = lastLlmError() ?? "ai_error"
      audit("llm-null", { ip, provider: engine.provider.id, reason: aiReason })
    } catch (err) {
      aiReason = "ai_error"
      audit("llm-threw", { ip, err: String(err) })
    }
  }

  // 13. Fallback (rule-based). Always available, even with no AI configured.
  try {
    const fallback: AdvisorOutput = await buildLocalAdvice(team, userMessage)
    const safe = cleanLlmOutput(fallback.analysis)
    await persistAssistant(db, conversationId!, safe, null, "local")
    return NextResponse.json(
      {
        content: safe,
        data: fallback,
        mode: "local" as const,
        aiConfigured: engine.ok,
        aiReason,
        conversationId,
      },
      { headers: securityHeaders() },
    )
  } catch (err) {
    audit("fallback-failed", { ip, err: String(err) })
    return jsonError(
      "Something went wrong while processing your query. Please try again.",
      500,
    )
  }
}

async function persistAssistant(
  db: ReturnType<typeof getDb>,
  conversationId: string,
  content: string,
  model: string | null,
  mode: "llm" | "local",
): Promise<void> {
  try {
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId,
      role: "assistant",
      content,
      model,
      mode,
    })
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId))
  } catch {
    // Best-effort persistence.
  }
}

export async function GET() {
  return jsonError("Method not allowed.", 405, { Allow: "POST" })
}
