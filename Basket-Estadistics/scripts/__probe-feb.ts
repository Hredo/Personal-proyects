/* Temporary probe — safe to delete */
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0"
const URL_ = "https://baloncestoenvivo.feb.es/rankings/primerafeb/1/2025"

async function fetchText(url: string, body?: string): Promise<string> {
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    body,
    headers: {
      "User-Agent": UA,
      Accept: "text/html",
      "Accept-Language": "es-ES,es;q=0.9",
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.text()
}

function hiddensOf(html: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const tag of html.match(/<input[^>]*type="hidden"[^>]*>/gi) ?? []) {
    const name = tag.match(/name="([^"]+)"/)?.[1]
    const value = tag.match(/value="([^"]*)"/)?.[1] ?? ""
    if (name) out[name] = value.replace(/&#43;/g, "+").replace(/&#47;/g, "/").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
  }
  return out
}

async function main() {
  const html = await fetchText(URL_)
  const hiddens = hiddensOf(html)
  console.log("hiddens:", Object.keys(hiddens).join(", "))

  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(hiddens)) body.set(k, v)
  body.set("_ctl0:MainContentPlaceHolderMaster:temporadasDropDownList", "2025")
  body.set("_ctl0:MainContentPlaceHolderMaster:gruposDropDownList", html.match(/gruposDropDownList[^>]*>[\s\S]*?<option selected="selected" value="([^"]+)"/)?.[1] ?? "")
  body.set("_ctl0:MainContentPlaceHolderMaster:rankingsDropDownList", "14")
  body.set("_ctl0:MainContentPlaceHolderMaster:nacionalDropDownList", "0")
  body.set("_ctl0:MainContentPlaceHolderMaster:jornadasDropDownList", "-1")
  body.set("_ctl0:MainContentPlaceHolderMaster:equiposDropDownList", "-1")
  body.set("__EVENTTARGET", "_ctl0:MainContentPlaceHolderMaster:rankingsDropDownList")
  body.set("__EVENTARGUMENT", "")

  const html2 = await fetchText(URL_, body.toString())
  // Show the header row + first data row of the ranking table
  const thMatches = html2.match(/<th[^>]*>[\s\S]*?<\/th>/gi) ?? []
  console.log("\nTH cells:")
  for (const th of thMatches.slice(0, 12)) {
    console.log(" ", th.replace(/\s+/g, " ").slice(0, 120))
  }
  const dataRows = [...html2.matchAll(/<tr[^>]*>([\s\S]*?Jugador\.aspx[\s\S]*?)<\/tr>/gi)]
  console.log(`\nData rows: ${dataRows.length}; first two:`)
  for (const r of dataRows.slice(0, 2)) {
    console.log(" ", r[1].replace(/\s+/g, " ").slice(0, 900), "\n")
  }
}

main().catch((e) => {
  console.error("PROBE FAILED:", e?.message ?? e)
  process.exit(1)
})
