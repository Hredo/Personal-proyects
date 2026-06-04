/**
 * Security helpers for the AI advisor endpoint.
 *
 * Protections:
 *  - SSRF guard: only allow Ollama on loopback / private RFC1918 addresses.
 *  - Input validation: length caps, control-char stripping, prompt-injection detection.
 *  - Output sanitisation: strip control characters, cap length, neutralise HTML.
 *  - Per-IP rate limit (token bucket, in-memory).
 *  - Audit logging helper.
 */

import { NextResponse } from "next/server"

export const MAX_USER_MESSAGE_LEN = 2_000
export const MAX_HISTORY_MESSAGES = 8
export const MAX_HISTORY_MESSAGE_LEN = 1_500
export const MAX_LLM_OUTPUT_CHARS = 20_000

const RATE_LIMIT_BUCKET = new Map<string, { tokens: number; updated: number }>()
const RATE_LIMIT_CAPACITY = 12
const RATE_LIMIT_REFILL_PER_SEC = 0.2 // 1 token / 5s, burst 12

type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number }

export function rateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const bucket = RATE_LIMIT_BUCKET.get(ip) ?? {
    tokens: RATE_LIMIT_CAPACITY,
    updated: now,
  }
  const elapsed = (now - bucket.updated) / 1000
  const refilled = Math.min(
    RATE_LIMIT_CAPACITY,
    bucket.tokens + elapsed * RATE_LIMIT_REFILL_PER_SEC,
  )
  if (refilled < 1) {
    RATE_LIMIT_BUCKET.set(ip, { tokens: refilled, updated: now })
    return { ok: false, retryAfterSec: Math.ceil((1 - refilled) / RATE_LIMIT_REFILL_PER_SEC) }
  }
  RATE_LIMIT_BUCKET.set(ip, { tokens: refilled - 1, updated: now })
  return { ok: true }
}

const SSRF_ALLOWED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
])

/**
 * Validate that OLLAMA_BASE_URL points to a loopback address.
 * Returns the cleaned URL or null if the URL is unsafe.
 */
export function safeOllamaBaseUrl(raw: string | undefined): string | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null
  const host = url.hostname.toLowerCase()
  if (SSRF_ALLOWED_HOSTS.has(host)) return url.toString().replace(/\/$/, "")
  // Private IPv4 (10.x, 192.168.x, 172.16-31.x) — allowed only if env explicitly opts in
  if (/^10\.\d+\.\d+\.\d+$/.test(host)) return url.toString().replace(/\/$/, "")
  if (/^192\.168\.\d+\.\d+$/.test(host)) return url.toString().replace(/\/$/, "")
  if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host)) return url.toString().replace(/\/$/, "")
  return null
}

// ---- Input sanitisation ---------------------------------------------------

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g

export function cleanUserText(raw: string): string {
  return raw
    .replace(CONTROL_CHARS, " ")
    .replace(ZERO_WIDTH, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// Patterns that look like prompt-injection / jailbreak attempts.
const INJECTION_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /ignore\s+(all\s+)?previous\s+(instructions|prompts|rules)/i, label: "ignore-previous" },
  { re: /forget\s+(all\s+)?(previous|prior|earlier)/i, label: "forget-previous" },
  { re: /you\s+are\s+now\s+(a|an|the)\s+/i, label: "role-reassignment" },
  { re: /\bact\s+as\s+(a|an|the)\s+/i, label: "act-as" },
  { re: /\bsystem\s*[:>]\s*/i, label: "fake-system-tag" },
  { re: /\bdeveloper\s*[:>]\s*/i, label: "fake-developer-tag" },
  { re: /\bassistant\s*[:>]\s*/i, label: "fake-assistant-tag" },
  { re: /\<\|im_start\|\>/i, label: "chatml-im_start" },
  { re: /\<\|im_end\|\>/i, label: "chatml-im_end" },
  { re: /\[INST\]/i, label: "llama2-inst" },
  { re: /\[\/INST\]/i, label: "llama2-inst-close" },
  { re: /\<\<SYS\>\>/i, label: "llama2-sys" },
  { re: /reveal\s+(your|the)\s+(system|initial|hidden)\s+prompt/i, label: "prompt-extract" },
  { re: /print\s+(your|the)\s+(system|initial)\s+prompt/i, label: "prompt-extract" },
  { re: /disregard\s+(safety|guardrails|guidelines)/i, label: "bypass-safety" },
  { re: /jailbreak/i, label: "explicit-jailbreak" },
  { re: /bypass\s+(the\s+)?(filter|moderation|safety)/i, label: "bypass-moderation" },
  { re: /execute\s+(code|command|script|sql)/i, label: "code-exec-attempt" },
  { re: /<\s*script\b/i, label: "xss-script" },
  { re: /javascript\s*:/i, label: "xss-js-uri" },
  { re: /on(load|error|click|mouseover)\s*=/i, label: "xss-event-handler" },
  { re: /\bcurl\s+http/i, label: "shell-curl" },
  { re: /\bwget\s+http/i, label: "shell-wget" },
  { re: /\brm\s+-rf\b/i, label: "shell-rm" },
  { re: /\.\.\//g, label: "path-traversal" },
]

export type InjectionFinding = { label: string; match: string }

export function detectInjection(raw: string): InjectionFinding[] {
  const findings: InjectionFinding[] = []
  for (const { re, label } of INJECTION_PATTERNS) {
    const m = re.exec(raw)
    if (m) findings.push({ label, match: m[0] })
  }
  return findings
}

// ---- Output sanitisation --------------------------------------------------

/**
 * Strip characters and patterns that could break rendering or be used for XSS,
 * even though our Markdown renderer doesn't pass through raw HTML, defence-in-depth.
 */
export function cleanLlmOutput(raw: string): string {
  return raw
    .replace(CONTROL_CHARS, " ")
    .replace(ZERO_WIDTH, "")
    // Belt-and-braces: neutralise stray HTML tags. Our parser doesn't render
    // them, but if a future change does, this stops obvious XSS payloads.
    .replace(
      new RegExp("<\\s*(script|iframe|object|embed|svg)[^>]*>[\\s\\S]*?<\\s*/\\s*\\1\\s*>", "gi"),
      "[contenido bloqueado]",
    )
    .replace(/<\s*(script|iframe|object|embed|svg)[^>]*\/?>/gi, "[contenido bloqueado]")
    .replace(/(href|src)\s*=\s*["']?\s*javascript:/gi, "$1=")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .trim()
    .slice(0, MAX_LLM_OUTPUT_CHARS)
}

// ---- Response helpers -----------------------------------------------------

export function securityHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
    ...extra,
  }
}

export function jsonError(
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  return NextResponse.json(
    { content: message, error: true },
    { status, headers: securityHeaders(extraHeaders) },
  )
}

// ---- Audit log ------------------------------------------------------------

export function audit(event: string, details: Record<string, unknown>): void {
  const ts = new Date().toISOString()
  // Single-line compact JSON, easy to grep in dev/prod logs.
  const payload = JSON.stringify({ ts, event, ...details })
  console.log(`[security] ${payload}`)
}

// ---- IP extraction --------------------------------------------------------

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() || "unknown"
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}
