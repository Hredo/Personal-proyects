/**
 * Catalogue of AI providers the app can drive for the AI Advisor and AI
 * Compare features. Single source of truth shared by:
 *  - the account "AI & keys" manager (list + key inputs)
 *  - the per-feature engine picker (settings)
 *  - the chat dispatcher (lib/ai/chat.ts)
 *  - the public setup guide (/ai-setup)
 *
 * No secrets and no React here — just static metadata.
 */

export type ProviderKind =
  | "openai" // native OpenAI Chat Completions
  | "openai-compat" // OpenAI-compatible /chat/completions (Groq, Mistral, …)
  | "anthropic" // Claude Messages API
  | "google" // Gemini generateContent
  | "local" // user's own machine (Ollama) — no key needed

export type AiModel = {
  id: string
  label: string
}

export type AiProvider = {
  id: string
  name: string
  /** One-line description shown in the catalogue. */
  blurb: string
  kind: ProviderKind
  /** Base URL for the HTTP API. Local providers resolve it from env at call time. */
  baseUrl: string
  /** Whether the user must paste an API key (false for local engines). */
  needsKey: boolean
  /** Expected key prefix, for a soft client-side sanity check. */
  keyPrefix?: string
  /** Where to create the key (console URL), surfaced in the UI and the guide. */
  keyUrl?: string
  models: AiModel[]
  defaultModel: string
  supportsAdvisor: boolean
  supportsCompare: boolean
  /** Short, ordered "how to connect" steps for the setup guide. */
  guide: string[]
  /** Accent color (hex) for the provider chip/logo. */
  accent: string
}

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: "ollama",
    name: "Ollama (local)",
    blurb:
      "Run open models on your own machine. Fully private, no key, no cost.",
    kind: "local",
    baseUrl: "http://localhost:11434/v1",
    needsKey: false,
    keyUrl: "https://ollama.com/download",
    models: [
      { id: "llama3.1:8b", label: "Llama 3.1 8B" },
      { id: "qwen2.5:7b", label: "Qwen 2.5 7B" },
      { id: "gemma2:9b", label: "Gemma 2 9B" },
      { id: "mistral", label: "Mistral 7B" },
      { id: "llama3.2:3b", label: "Llama 3.2 3B (light)" },
    ],
    defaultModel: "llama3.1:8b",
    supportsAdvisor: true,
    supportsCompare: true,
    accent: "#9ca3af",
    guide: [
      "Install the Ollama app from ollama.com/download.",
      "Pull a model in your terminal: ollama pull llama3.1:8b",
      "Make sure Ollama is running (the app, or `ollama serve`).",
      "Pick “Ollama (local)” here — we detect it automatically, no key needed.",
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    blurb: "GPT-4o family. Reliable reasoning and great multilingual output.",
    kind: "openai",
    baseUrl: "https://api.openai.com/v1",
    needsKey: true,
    keyPrefix: "sk-",
    keyUrl: "https://platform.openai.com/api-keys",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini (fast, cheap)" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    ],
    defaultModel: "gpt-4o-mini",
    supportsAdvisor: true,
    supportsCompare: true,
    accent: "#10a37f",
    guide: [
      "Create an account at platform.openai.com and add billing.",
      "Open platform.openai.com/api-keys and create a new secret key.",
      "Copy the key (starts with sk-…) — it is shown only once.",
      "Paste it here and pick a model (GPT-4o mini is a great default).",
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    blurb: "Claude 3.5 — strong analysis and clean, structured answers.",
    kind: "anthropic",
    baseUrl: "https://api.anthropic.com",
    needsKey: true,
    keyPrefix: "sk-ant-",
    keyUrl: "https://console.anthropic.com/settings/keys",
    models: [
      { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku (fast)" },
      { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
    ],
    defaultModel: "claude-3-5-haiku-latest",
    supportsAdvisor: true,
    supportsCompare: true,
    accent: "#d97757",
    guide: [
      "Sign in at console.anthropic.com and add credits.",
      "Go to Settings → API keys and create a key.",
      "Copy the key (starts with sk-ant-…).",
      "Paste it here and choose Haiku (fast) or Sonnet (deeper).",
    ],
  },
  {
    id: "google",
    name: "Google Gemini",
    blurb: "Gemini 1.5/2.0 — generous free tier and fast flash models.",
    kind: "google",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    needsKey: true,
    keyPrefix: "AIza",
    keyUrl: "https://aistudio.google.com/app/apikey",
    models: [
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
    defaultModel: "gemini-1.5-flash",
    supportsAdvisor: true,
    supportsCompare: true,
    accent: "#4285f4",
    guide: [
      "Open aistudio.google.com/app/apikey and sign in with Google.",
      "Click “Create API key” (a free tier is available).",
      "Copy the key (starts with AIza…).",
      "Paste it here and pick a Flash model for the best speed.",
    ],
  },
  {
    id: "groq",
    name: "Groq",
    blurb: "Open models (Llama 3.3) served extremely fast on Groq LPUs.",
    kind: "openai-compat",
    baseUrl: "https://api.groq.com/openai/v1",
    needsKey: true,
    keyPrefix: "gsk_",
    keyUrl: "https://console.groq.com/keys",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (instant)" },
    ],
    defaultModel: "llama-3.3-70b-versatile",
    supportsAdvisor: true,
    supportsCompare: true,
    accent: "#f55036",
    guide: [
      "Create an account at console.groq.com (free to start).",
      "Open console.groq.com/keys and create an API key.",
      "Copy the key (starts with gsk_…).",
      "Paste it here — Llama 3.3 70B is a strong, fast default.",
    ],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    blurb: "Mistral Large and friends — European, OpenAI-compatible API.",
    kind: "openai-compat",
    baseUrl: "https://api.mistral.ai/v1",
    needsKey: true,
    keyUrl: "https://console.mistral.ai/api-keys",
    models: [
      { id: "mistral-large-latest", label: "Mistral Large" },
      { id: "mistral-small-latest", label: "Mistral Small" },
    ],
    defaultModel: "mistral-large-latest",
    supportsAdvisor: true,
    supportsCompare: true,
    accent: "#fa520f",
    guide: [
      "Sign up at console.mistral.ai and add a payment method.",
      "Go to API keys and create a new key.",
      "Copy the key.",
      "Paste it here and choose Large (quality) or Small (cheap).",
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    blurb: "One key, hundreds of models routed through a single API.",
    kind: "openai-compat",
    baseUrl: "https://openrouter.ai/api/v1",
    needsKey: true,
    keyPrefix: "sk-or-",
    keyUrl: "https://openrouter.ai/keys",
    models: [
      { id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
    ],
    defaultModel: "openai/gpt-4o-mini",
    supportsAdvisor: true,
    supportsCompare: true,
    accent: "#6467f2",
    guide: [
      "Create an account at openrouter.ai and add credits.",
      "Open openrouter.ai/keys and create a key.",
      "Copy the key (starts with sk-or-…).",
      "Paste it here and pick any of the routed models.",
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    blurb: "DeepSeek V3 chat — capable and very cost-effective.",
    kind: "openai-compat",
    baseUrl: "https://api.deepseek.com/v1",
    needsKey: true,
    keyPrefix: "sk-",
    keyUrl: "https://platform.deepseek.com/api_keys",
    models: [{ id: "deepseek-chat", label: "DeepSeek Chat (V3)" }],
    defaultModel: "deepseek-chat",
    supportsAdvisor: true,
    supportsCompare: true,
    accent: "#4d6bfe",
    guide: [
      "Sign up at platform.deepseek.com and top up a little credit.",
      "Open the API keys page and create a key.",
      "Copy the key (starts with sk-…).",
      "Paste it here and use deepseek-chat.",
    ],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    blurb: "Grok models via xAI's OpenAI-compatible endpoint.",
    kind: "openai-compat",
    baseUrl: "https://api.x.ai/v1",
    needsKey: true,
    keyPrefix: "xai-",
    keyUrl: "https://console.x.ai",
    models: [
      { id: "grok-2-latest", label: "Grok 2" },
      { id: "grok-beta", label: "Grok Beta" },
    ],
    defaultModel: "grok-2-latest",
    supportsAdvisor: true,
    supportsCompare: true,
    accent: "#1d9bf0",
    guide: [
      "Sign in at console.x.ai and add billing.",
      "Create an API key from the console.",
      "Copy the key (starts with xai-…).",
      "Paste it here and choose Grok 2.",
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    blurb: "Sonar models with built-in web grounding.",
    kind: "openai-compat",
    baseUrl: "https://api.perplexity.ai",
    needsKey: true,
    keyPrefix: "pplx-",
    keyUrl: "https://www.perplexity.ai/settings/api",
    models: [
      { id: "sonar", label: "Sonar" },
      { id: "sonar-pro", label: "Sonar Pro" },
    ],
    defaultModel: "sonar",
    supportsAdvisor: true,
    supportsCompare: true,
    accent: "#20808d",
    guide: [
      "Open perplexity.ai/settings/api and add a payment method.",
      "Generate an API key.",
      "Copy the key (starts with pplx-…).",
      "Paste it here and pick Sonar.",
    ],
  },
]

export const PROVIDERS_BY_ID: Record<string, AiProvider> = Object.fromEntries(
  AI_PROVIDERS.map((p) => [p.id, p]),
)

export function getProvider(id: string | null | undefined): AiProvider | null {
  if (!id) return null
  return PROVIDERS_BY_ID[id] ?? null
}

export type AiFeature = "advisor" | "compare"

export function providersForFeature(feature: AiFeature): AiProvider[] {
  return AI_PROVIDERS.filter((p) =>
    feature === "advisor" ? p.supportsAdvisor : p.supportsCompare,
  )
}

/** Validate that a model id belongs to a provider; fall back to its default. */
export function resolveModel(
  provider: AiProvider,
  model: string | null | undefined,
): string {
  if (model && provider.models.some((m) => m.id === model)) return model
  return provider.defaultModel
}
