import { acbAdapter } from "../src/lib/sources/acb"

async function main() {
  const origFetch = globalThis.fetch
  let html = ""
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const res = await origFetch(url, init)
    const text = await res.text()
    const u = String(url)
    if (u.includes("/es/liga/equipos/") && !u.includes("/plantilla")) {
      html = text
      console.log(`Fetched ${u} (${text.length} bytes)`)
    }
    return new Response(text, { status: res.status, statusText: res.statusText, headers: res.headers })
  }) as typeof fetch

  // Trigger fetching one team page
  const teams = await acbAdapter.fetchTeams()
  console.log(`Got ${teams.length} teams`)

  // Check the regex on the cached html
  const re = /__label"[^>]*>([^<]+)<\/span>[\s\S]{0,400}?__resumenStandingsFieldValue[^>]*>\s*(\d[\d.,]*)/g
  let m: RegExpExecArray | null
  const matches: Array<[string, string]> = []
  while ((m = re.exec(html)) !== null) {
    matches.push([m[1].trim(), m[2]])
  }
  console.log("Standings matches:", matches)

  globalThis.fetch = origFetch
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
