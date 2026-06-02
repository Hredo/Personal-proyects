const DEFAULT_TIMEOUT_MS = 15_000

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly url?: string,
  ) {
    super(message)
    this.name = "FetchError"
  }
}

type FetchOptions = {
  timeoutMs?: number
  headers?: Record<string, string>
  retries?: number
  backoffMs?: number
}

export async function fetchJson<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers = {},
    retries = 2,
    backoffMs = 500,
  } = options

  const finalHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
    ...headers,
  }

  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: finalHeaders,
      })
      if (!res.ok) {
        throw new FetchError(
          `HTTP ${res.status} ${res.statusText}`,
          res.status,
          url,
        )
      }
      const text = await res.text()
      try {
        return JSON.parse(text) as T
      } catch (parseErr) {
        throw new FetchError(
          `Invalid JSON from ${url}: ${(parseErr as Error).message}`,
          res.status,
          url,
        )
      }
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await sleep(backoffMs * (attempt + 1))
      }
    } finally {
      clearTimeout(timer)
    }
  }
  if (lastError instanceof Error) throw lastError
  throw new FetchError(`Unknown error fetching ${url}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
