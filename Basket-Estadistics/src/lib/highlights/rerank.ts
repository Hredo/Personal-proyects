import type { YouTubeCandidate } from "./youtube"

const HF_INFERENCE_ENDPOINT = "https://api-inference.huggingface.co/models"
const HF_TIMEOUT_MS = 7_000
const DEFAULT_RERANK_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"

export async function pickBestCandidateWithHuggingFace(
  candidates: YouTubeCandidate[],
  playerName: string,
): Promise<YouTubeCandidate | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) return null
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  const model =
    process.env.HUGGINGFACE_RERANK_MODEL?.trim() || DEFAULT_RERANK_MODEL

  const prompt = buildRerankPrompt(playerName, candidates)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HF_TIMEOUT_MS)

  try {
    const res = await fetch(`${HF_INFERENCE_ENDPOINT}/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 8,
          temperature: 0,
          return_full_text: false,
          stop: ["\n"],
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) return null
    const json = (await res.json()) as unknown
    if (Array.isArray(json)) {
      const first = json[0] as { generated_text?: string } | undefined
      const text = first?.generated_text ?? ""
      const idx = parseChoice(text, candidates.length)
      if (idx == null) return null
      return candidates[idx]
    }
    if (json && typeof json === "object" && "error" in json) return null
    if (json && typeof json === "object" && "generated_text" in json) {
      const text = (json as { generated_text?: string }).generated_text ?? ""
      const idx = parseChoice(text, candidates.length)
      if (idx == null) return null
      return candidates[idx]
    }
    return null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function buildRerankPrompt(
  playerName: string,
  candidates: YouTubeCandidate[],
): string {
  const list = candidates
    .map((c, i) => `${i + 1}. ${c.title}`)
    .join("\n")
  return (
    `<s>[INST] You are ranking YouTube search results. ` +
    `Pick the single best highlight reel for the basketball player "${playerName}". ` +
    `A highlight reel is a compilation of plays from games (dunks, shots, blocks, etc). ` +
    `Reject interviews, news reports, documentaries, trade rumours, shoe reviews and similar. ` +
    `Reply with ONLY the number (1-${candidates.length}).\n\n${list} [/INST]`
  )
}

function parseChoice(text: string, max: number): number | null {
  const m = text.match(/\b(\d{1,2})\b/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (!Number.isFinite(n) || n < 1 || n > max) return null
  return n - 1
}
