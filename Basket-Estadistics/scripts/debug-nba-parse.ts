async function main() {
  const url = "https://www.basketball-reference.com/leagues/NBA_2025.html"
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    },
  })
  const html = await res.text()
  const m = html.match(/<table[^>]*\bid="per_game-team"[\s\S]*?<\/table>/)
  if (!m) return console.log("not found")
  const rows = m[0].match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) ?? []
  console.log("rows:", rows.length)
  for (let i = 1; i < Math.min(5, rows.length); i++) {
    const cells = new Map<string, string>()
    const cellRe =
      /<t[hd]\b[^>]*\bdata-stat="([^"]+)"[^>]*>([\s\S]*?)<\/t[hd]>/g
    let mm: RegExpExecArray | null
    while ((mm = cellRe.exec(rows[i])) !== null) {
      const stat = mm[1]
      const inner = mm[2].replace(/<[^>]+>/g, "").trim()
      cells.set(stat, inner)
    }
    console.log(
      `row ${i}:`,
      cells.get("team"),
      cells.get("g"),
      cells.get("wins"),
      cells.get("losses"),
      cells.get("pts_per_g"),
    )
  }
}
main().catch(console.error)
