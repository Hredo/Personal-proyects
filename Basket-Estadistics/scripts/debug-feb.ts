/**
 * Probe: validate that we can scrape FEB (baloncestoenvivo.feb.es) rankings
 * for the full Liga Regular phase by replicating the ASP.NET WebForms postback.
 * Run: pnpm tsx scripts/debug-feb.ts
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
const BASE = "https://baloncestoenvivo.feb.es"
const LIGA_REGULAR = "88871"

async function getText(
  url: string,
  init?: RequestInit & { body?: string },
): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "es-ES,es;q=0.9",
      ...(init?.body
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} (${url})`)
  return res.text()
}

function parseHiddens(html: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const tag of html.match(/<input[^>]*type="hidden"[^>]*>/gi) ?? []) {
    const name = tag.match(/name="([^"]+)"/)?.[1]
    const value = tag.match(/value="([^"]*)"/)?.[1] ?? ""
    if (name) out[name] = value
  }
  return out
}

type Select = {
  name: string
  options: Array<{ value: string; text: string; selected: boolean }>
}

function parseSelects(html: string): Select[] {
  const out: Select[] = []
  const re = /<select[^>]*\bname="([^"]+)"[^>]*>([\s\S]*?)<\/select>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const name = m[1]!
    const options: Select["options"] = []
    const ore = /<option([^>]*)>([\s\S]*?)<\/option>/gi
    let om: RegExpExecArray | null
    while ((om = ore.exec(m[2]!)) !== null) {
      const attrs = om[1] ?? ""
      options.push({
        value: attrs.match(/value="([^"]*)"/)?.[1] ?? "",
        text: om[2]!.replace(/<[^>]+>/g, "").trim(),
        selected: /\bselected\b/i.test(attrs),
      })
    }
    out.push({ name, options })
  }
  return out
}

function countData(html: string): { players: number; teams: number; header: string } {
  const players = new Set(
    (html.match(/Jugador\.aspx\?i=\d+&(?:amp;)?c=\d+/gi) ?? []).map((s) =>
      s.replace(/&amp;/g, "&"),
    ),
  )
  const teams = new Set(html.match(/Equipo\.aspx\?i=(\d+)/gi) ?? [])
  const header =
    html.replace(/\s+/g, " ").match(/Rankings Acumulados[^<]*/i)?.[0] ?? "(no header)"
  return { players: players.size, teams: teams.size, header }
}

async function main() {
  const url = `${BASE}/rankings.aspx?g=1&t=2025&nm=primerafeb`
  console.log(`GET ${url}`)
  const html = await getText(url)
  const def = countData(html)
  console.log(`  default phase -> players=${def.players} teams=${def.teams}`)
  console.log(`  header: ${def.header}`)

  const hiddens = parseHiddens(html)
  const selects = parseSelects(html)
  console.log(
    `  hidden fields: ${Object.keys(hiddens).join(", ") || "(none)"}`,
  )
  const phase = selects.find((s) =>
    s.options.some((o) => o.value === LIGA_REGULAR),
  )
  const stat = selects.find((s) =>
    s.options.some((o) => o.text === "Valoración"),
  )
  console.log(`  phase select: ${phase?.name ?? "NOT FOUND"}`)
  console.log(`  stat select:  ${stat?.name ?? "NOT FOUND"}`)
  if (!phase) throw new Error("Could not locate the phase <select> (88871).")

  // Build the WebForms postback body: every form field, with the phase select
  // switched to Liga Regular and __EVENTTARGET set to that select.
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(hiddens)) body.set(k, v)
  for (const s of selects) {
    const selected = s.options.find((o) => o.selected) ?? s.options[0]
    body.set(s.name, selected?.value ?? "")
  }
  body.set(phase.name, LIGA_REGULAR)
  body.set("__EVENTTARGET", phase.name)
  body.set("__EVENTARGUMENT", "")

  console.log(`\nPOST (switch to Liga Regular ${LIGA_REGULAR})`)
  const post = await getText(url, { method: "POST", body: body.toString() })
  const lr = countData(post)
  console.log(`  liga regular -> uniquePlayers=${lr.players} teams=${lr.teams}`)
  console.log(`  header: ${lr.header}`)

  const rawPlayerLinks = (post.match(/Jugador\.aspx\?i=\d+&(?:amp;)?c=\d+/gi) ?? [])
    .length
  console.log(`  raw player links (row count): ${rawPlayerLinks}`)
  const pager = post.match(/(Pagina|p[aá]gina|pager|siguiente|>>|_ctl0[^"']*[Pp]ag[^"']*)/g)
  console.log(`  pagination hints: ${pager ? pager.slice(0, 4).join(" | ") : "none"}`)

  const { writeFileSync } = await import("node:fs")
  writeFileSync("C:/Users/Hrval/AppData/Local/Temp/feb_lr.html", post)
  console.log("  wrote response to %TEMP%/feb_lr.html")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
