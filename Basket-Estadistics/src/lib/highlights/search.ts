import {
  extractYouTubeId,
  youtubeThumbnail,
  type Highlight,
  type YouTubeCandidate,
} from "./youtube"
import { pickBestCandidateWithHuggingFace } from "./rerank"

const DDG_ENDPOINT = "https://html.duckduckgo.com/html/"
const DDG_TIMEOUT_MS = 6_000
const INVIDIOUS_TIMEOUT_MS = 6_000
const MAX_CANDIDATES = 8

const INVIDIOUS_INSTANCES = [
  "https://invidious.flokinet.to",
  "https://invidious.protokolla.fi",
  "https://yewtu.be",
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://vid.puffyan.us",
]

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

const HIGHLIGHT_HINTS =
  /\b(highlights?|top plays|best plays|season highlights|career high|mix|best of|all stars?|dunk contest)\b/i
const NEGATIVE_HINTS =
  /\b(interview|press conference|post ?game|news|report|breakdown|reaction|podcast|documentary|trailer|episode|review|story|injury update|trade rumor|shoe|signature|commercial|ad)\b/i

export type SearchOptions = {
  playerName: string
  teamName?: string | null
  leagueName?: string | null
}

type InvidiousVideo = {
  title?: string
  videoId?: string
  author?: string
}

async function searchInvidious(
  opts: SearchOptions,
): Promise<YouTubeCandidate[] | null> {
  const query = buildInvidiousQuery(opts)

  for (const base of INVIDIOUS_INSTANCES) {
    const url =
      `${base}/api/v1/search?q=${encodeURIComponent(query)}` +
      `&type=video&fields=title,videoId,author`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), INVIDIOUS_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: controller.signal,
      })
      if (!res.ok) continue
      const json = (await res.json()) as unknown
      if (!Array.isArray(json)) continue
      const out: YouTubeCandidate[] = []
      const seen = new Set<string>()
      for (const item of json) {
        const v = item as InvidiousVideo
        if (!v.videoId || !v.title) continue
        if (seen.has(v.videoId)) continue
        seen.add(v.videoId)
        out.push({
          videoId: v.videoId,
          title: v.title,
          snippet: v.author ?? "",
        })
        if (out.length >= MAX_CANDIDATES) break
      }
      if (out.length > 0) return out
    } catch {
      // try next instance
    } finally {
      clearTimeout(timer)
    }
  }
  return null
}

function buildInvidiousQuery(opts: SearchOptions): string {
  const parts: string[] = []
  parts.push(`"${opts.playerName}"`)
  if (opts.teamName) parts.push(`"${opts.teamName}"`)
  parts.push("basketball highlights")
  return parts.join(" ")
}

type DdgResult = { title: string; url: string; snippet: string }

async function searchDuckDuckGo(query: string): Promise<DdgResult[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DDG_TIMEOUT_MS)
  try {
    const res = await fetch(`${DDG_ENDPOINT}?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    })
    if (res.status === 202 || res.status === 429) return []
    if (!res.ok) return []
    const html = await res.text()
    return parseDdgHtml(html)
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

function parseDdgHtml(html: string): DdgResult[] {
  const results: DdgResult[] = []
  const seen = new Set<string>()

  const linkRe =
    /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(html)) !== null) {
    const raw = m[1]
    const url = decodeDdgUrl(decodeHtml(raw))
    const title = stripTags(m[2]).trim()
    if (!url || !title || seen.has(url)) continue
    seen.add(url)
    results.push({ url, title, snippet: "" })
    if (results.length >= 20) break
  }

  const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
  let i = 0
  while ((m = snippetRe.exec(html)) !== null && i < results.length) {
    results[i].snippet = stripTags(m[1]).trim()
    i++
  }

  return results
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
}

function decodeDdgUrl(u: string): string {
  if (u.startsWith("/") || u.startsWith("//")) {
    try {
      const parsed = new URL(u, "https://duckduckgo.com")
      const real = parsed.searchParams.get("uddg")
      if (real) return real
    } catch {
      // fall through
    }
  }
  return u
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ")
}

function extractDdgCandidates(results: DdgResult[]): YouTubeCandidate[] {
  const seen = new Set<string>()
  const out: YouTubeCandidate[] = []
  for (const r of results) {
    const id = extractYouTubeId(r.url)
    if (!id) continue
    if (seen.has(id)) continue
    seen.add(id)
    out.push({ videoId: id, title: r.title, snippet: r.snippet })
    if (out.length >= MAX_CANDIDATES) break
  }
  return out
}

function buildNameRegex(name: string): RegExp | null {
  const parts = name
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => p.length >= 3)
  if (parts.length === 0) return null
  return new RegExp(`\\b(${parts.map(escapeRegExp).join("|")})\\b`, "i")
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function scoreCandidate(
  c: YouTubeCandidate,
  nameRe: RegExp | null,
  teamRe: RegExp | null,
): number {
  let score = 0
  if (HIGHLIGHT_HINTS.test(c.title)) score += 10
  if (NEGATIVE_HINTS.test(c.title)) score -= 15
  if (nameRe?.test(c.title)) score += 5
  if (nameRe?.test(c.snippet)) score += 2
  if (teamRe?.test(c.title)) score += 3
  return score
}

export async function findPlayerHighlight(
  opts: SearchOptions,
): Promise<Highlight | null> {
  let candidates: YouTubeCandidate[] = []
  let source = "invidious"

  const invidiousResults = await searchInvidious(opts)
  if (invidiousResults && invidiousResults.length > 0) {
    candidates = invidiousResults
  } else {
    const ddgQuery = buildDdgQuery(opts)
    const ddgResults = await searchDuckDuckGo(ddgQuery)
    candidates = extractDdgCandidates(ddgResults)
    source = "ddg-heuristic"
    if (candidates.length === 0) return null
  }

  const nameRe = buildNameRegex(opts.playerName)
  const teamRe = opts.teamName ? buildNameRegex(opts.teamName) : null

  const rerankPicked = await pickBestCandidateWithHuggingFace(
    candidates,
    opts.playerName,
  )
  let best: YouTubeCandidate
  if (rerankPicked) {
    best = rerankPicked
    source = "hf-rerank"
  } else {
    best = candidates[0]
    let bestScore = scoreCandidate(best, nameRe, teamRe)
    for (let i = 1; i < candidates.length; i++) {
      const s = scoreCandidate(candidates[i], nameRe, teamRe)
      if (s > bestScore) {
        best = candidates[i]
        bestScore = s
      }
    }
  }

  return {
    videoId: best.videoId,
    title: best.title,
    thumbnailUrl: youtubeThumbnail(best.videoId),
    source,
  }
}

function buildDdgQuery(opts: SearchOptions): string {
  const parts = [`"${opts.playerName}"`, "basketball", "highlights"]
  if (opts.teamName) parts.push(`"${opts.teamName}"`)
  if (opts.leagueName) parts.push(opts.leagueName)
  return parts.join(" ")
}
