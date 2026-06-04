import { NextResponse } from "next/server"
import { getTeamBySlug } from "@/lib/data/teams"
import { buildLocalAdvice, findPlayerInQuery } from "@/lib/ai/local-advisor"
import { generateAdvisorResponse, isLlmEnabled, lastLlmError } from "@/lib/ai/llm"
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
  safeOllamaBaseUrl,
  securityHeaders,
} from "@/lib/security/ai-advisor"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export type AdvisorRequest = {
  teamSlug: string
  leagueSlug: string
  userMessage: string
  history?: Array<{ role: "user" | "assistant"; content: string }>
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  // 1. Rate limit per IP.
  const limit = rateLimit(ip)
  if (!limit.ok) {
    audit("rate-limit", { ip, retryAfterSec: limit.retryAfterSec })
    return new NextResponse(
      JSON.stringify({
        content: `Demasiadas solicitudes. Intenta de nuevo en ${limit.retryAfterSec}s.`,
        error: true,
      }),
      {
        status: 429,
        headers: securityHeaders({ "Retry-After": String(limit.retryAfterSec) }),
      },
    )
  }

  // 2. Content-Type guard.
  const ct = request.headers.get("content-type") ?? ""
  if (!ct.toLowerCase().includes("application/json")) {
    audit("bad-content-type", { ip, ct })
    return jsonError("Tipo de contenido no soportado.", 415)
  }

  // 3. Body size cap (defence in depth on top of Next's own limits).
  const rawLen = Number(request.headers.get("content-length") ?? 0)
  if (Number.isFinite(rawLen) && rawLen > 0 && rawLen > 64 * 1024) {
    audit("oversized-body", { ip, bytes: rawLen })
    return jsonError("Solicitud demasiado grande.", 413)
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
    return jsonError("Origen no permitido.", 403)
  }

  // 5. Parse body.
  let body: AdvisorRequest
  try {
    body = (await request.json()) as AdvisorRequest
  } catch {
    audit("invalid-json", { ip })
    return jsonError("JSON inválido.", 400)
  }

  // 6. Required fields.
  if (
    !body ||
    typeof body.teamSlug !== "string" ||
    typeof body.leagueSlug !== "string" ||
    typeof body.userMessage !== "string"
  ) {
    audit("missing-fields", { ip })
    return jsonError("Faltan datos del equipo o la pregunta.", 400)
  }
  if (!body.teamSlug.trim() || !body.leagueSlug.trim()) {
    return jsonError("Equipo o liga no válidos.", 400)
  }

  // 7. Sanitise and bound user input.
  const userMessage = cleanUserText(body.userMessage).slice(0, MAX_USER_MESSAGE_LEN)
  if (userMessage.length === 0) {
    return jsonError("La pregunta no puede estar vacía.", 400)
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
      "Tu mensaje contiene patrones no permitidos. Reformúlalo en una pregunta normal sobre fichajes.",
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
    return jsonError("Error al cargar el equipo.", 500)
  }
  if (!team) {
    return NextResponse.json(
      { content: `No se encontró el equipo en ${body.leagueSlug}.` },
      { headers: securityHeaders() },
    )
  }

  // 11. Optional: find player profile for richer context.
  let playerProfile = null
  try {
    playerProfile = await findPlayerInQuery(userMessage)
  } catch (err) {
    audit("player-lookup-error", { ip, err: String(err) })
  }

  // 12. LLM call (only if URL is safe).
  if (isLlmEnabled()) {
    // Defensive: refuse to call the LLM if the configured base URL is unsafe.
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL
    if (ollamaBaseUrl && !safeOllamaBaseUrl(ollamaBaseUrl)) {
      audit("unsafe-ollama-url", { ip, ollamaBaseUrl })
      return jsonError(
        "OLLAMA_BASE_URL apunta a un destino no permitido (loopback o red privada).",
        500,
      )
    }

    try {
      const llm = await generateAdvisorResponse({
        team,
        userMessage,
        history,
        playerProfile,
      })
      if (llm) {
        const safe = cleanLlmOutput(llm.content)
        return NextResponse.json(
          { content: safe, model: llm.model },
          { headers: securityHeaders() },
        )
      }
      console.warn(
        "AI advisor: LLM habilitado pero la llamada devolvió null. " +
          `Motivo: ${lastLlmError() ?? "desconocido"}. Usando fallback.`,
      )
    } catch (err) {
      audit("llm-threw", { ip, err: String(err) })
    }
  } else {
    console.warn(
      "AI advisor: LLM no habilitado. Usando fallback rule-based.",
    )
  }

  // 13. Fallback (rule-based).
  try {
    const fallback = await buildLocalAdvice(team, userMessage)
    const safe = cleanLlmOutput(fallback.analysis)
    return NextResponse.json(
      { content: safe },
      { headers: securityHeaders() },
    )
  } catch (err) {
    audit("fallback-failed", { ip, err: String(err) })
    return jsonError("Ocurrió un error al procesar la consulta. Inténtalo de nuevo.", 500)
  }
}

export async function GET() {
  return jsonError("Método no permitido.", 405, { Allow: "POST" })
}
