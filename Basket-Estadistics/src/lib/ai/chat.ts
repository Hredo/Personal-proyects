/**
 * Unified chat-completion dispatcher. Given a provider from the catalogue, a
 * model, an optional API key and a system + message list, it calls the right
 * HTTP API (OpenAI-compatible, Anthropic or Google) and returns plain text.
 *
 * Cloud base URLs come from the static catalogue (never user input). The only
 * user-controllable destination is the local Ollama URL, which is SSRF-guarded
 * via safeOllamaBaseUrl.
 */
import type { AiProvider } from "@/lib/ai/providers"
import { safeOllamaBaseUrl } from "@/lib/security/ai-advisor"

const TIMEOUT_MS = 120_000

export type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export type ChatInput = {
  provider: AiProvider
  model: string
  apiKey: string | null
  system: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}

export type ChatResult =
  | { ok: true; content: string; model: string }
  | { ok: false; error: string; status?: number }

function localBaseUrl(provider: AiProvider): string | null {
  const raw = process.env.OLLAMA_BASE_URL ?? provider.baseUrl
  return safeOllamaBaseUrl(raw)
}

async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fn(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}

/** OpenAI, OpenAI-compatible vendors, and local Ollama all share this shape. */
async function chatOpenAiCompatible(input: ChatInput): Promise<ChatResult> {
  const isLocal = input.provider.kind === "local"
  let baseUrl = input.provider.baseUrl
  if (isLocal) {
    const safe = localBaseUrl(input.provider)
    if (!safe) {
      return {
        ok: false,
        error:
          "The local model URL is not allowed (must be loopback or a private network).",
      }
    }
    baseUrl = safe
  } else if (!input.apiKey) {
    return { ok: false, error: "Missing API key." }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (input.apiKey) headers.Authorization = `Bearer ${input.apiKey}`
  // OpenRouter likes attribution headers; harmless elsewhere.
  if (input.provider.id === "openrouter") {
    headers["HTTP-Referer"] = "https://globalhoopstats.com"
    headers["X-Title"] = "globalhoopstats"
  }

  return withTimeout(async (signal) => {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({
        model: input.model,
        messages: [
          { role: "system", content: input.system },
          ...input.messages,
        ],
        max_tokens: input.maxTokens ?? 700,
        temperature: input.temperature ?? 0.6,
        stream: false,
      }),
    })
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300)
      return {
        ok: false,
        status: res.status,
        error: `${input.provider.name} ${res.status}: ${detail || res.statusText}`,
      }
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content?.trim()
    if (!content) return { ok: false, error: "Empty response." }
    return { ok: true, content, model: input.model }
  })
}

async function chatAnthropic(input: ChatInput): Promise<ChatResult> {
  if (!input.apiKey) return { ok: false, error: "Missing API key." }
  return withTimeout(async (signal) => {
    const res = await fetch(`${input.provider.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": input.apiKey as string,
        "anthropic-version": "2023-06-01",
      },
      signal,
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.maxTokens ?? 700,
        temperature: input.temperature ?? 0.6,
        system: input.system,
        messages: input.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300)
      return {
        ok: false,
        status: res.status,
        error: `Anthropic ${res.status}: ${detail || res.statusText}`,
      }
    }
    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    const content = json.content
      ?.filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("")
      .trim()
    if (!content) return { ok: false, error: "Empty response." }
    return { ok: true, content, model: input.model }
  })
}

async function chatGoogle(input: ChatInput): Promise<ChatResult> {
  if (!input.apiKey) return { ok: false, error: "Missing API key." }
  const url = `${input.provider.baseUrl}/models/${encodeURIComponent(
    input.model,
  )}:generateContent?key=${encodeURIComponent(input.apiKey)}`
  return withTimeout(async (signal) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: input.messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: input.maxTokens ?? 800,
          temperature: input.temperature ?? 0.6,
        },
      }),
    })
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300)
      return {
        ok: false,
        status: res.status,
        error: `Gemini ${res.status}: ${detail || res.statusText}`,
      }
    }
    const json = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
      }>
    }
    const content = json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim()
    if (!content) return { ok: false, error: "Empty response." }
    return { ok: true, content, model: input.model }
  })
}

export async function chatComplete(input: ChatInput): Promise<ChatResult> {
  try {
    switch (input.provider.kind) {
      case "anthropic":
        return await chatAnthropic(input)
      case "google":
        return await chatGoogle(input)
      case "openai":
      case "openai-compat":
      case "local":
        return await chatOpenAiCompatible(input)
      default:
        return { ok: false, error: "Unsupported provider." }
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "The model took too long to respond." }
    }
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === "ECONNREFUSED") {
      return {
        ok: false,
        error:
          "Could not reach the model. If you use Ollama, make sure it is running.",
      }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown chat error.",
    }
  }
}
