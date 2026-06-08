async function main() {
  const url = "https://www.basketball-reference.com/leagues/NBA_2025.html"
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    },
  })
  const html = await res.text()
  for (const id of ["divs_standings_E", "divs_standings_W"]) {
    const re = new RegExp(`<table[^>]*\\bid="${id}"[\\s\\S]*?<\\/table>`, "i")
    const m = html.match(re)
    if (!m) continue
    const rows = m[0].match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) ?? []
    console.log(`\n${id}:`)
    for (let i = 0; i < rows.length; i++) {
      const cells = new Map<string, string>()
      const cellRe =
        /<t[hd]\b[^>]*\bdata-stat="([^"]+)"[^>]*>([\s\S]*?)<\/t[hd]>/g
      let mm: RegExpExecArray | null
      while ((mm = cellRe.exec(rows[i])) !== null) {
        cells.set(mm[1], mm[2].replace(/<[^>]+>/g, "").trim())
      }
      const teamName = cells.get("team_name")
      const teamHref = rows[i].match(
        /<a[^>]*href=(?:"|')(\/teams\/[^"']+\.html)(?:"|')/,
      )
      const teamCode = teamHref?.[1].match(/\/teams\/([^/]+)\//)?.[1]
      if (teamName && teamCode) {
        console.log(`  ${teamName} (${teamCode})`)
      }
    }
  }
}
main().catch(console.error)
