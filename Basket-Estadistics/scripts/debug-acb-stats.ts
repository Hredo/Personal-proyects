async function main() {
  const url = `https://www.basketball-reference.com/international/spain-liga-acb/2026_per_game.html`
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    },
  })
  const html = await res.text()
  const m = html.match(/<table[^>]*\bid="per_game-stats-2026"[\s\S]*?<\/table>/)
  if (!m) return console.log("not found")
  const rows = m[0].match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) ?? []
  const cells = new Map<string, string>()
  const cellRe = /<t[hd]\b[^>]*\bdata-stat="([^"]+)"[^>]*>([\s\S]*?)<\/t[hd]>/g
  let mm: RegExpExecArray | null
  while ((mm = cellRe.exec(rows[1])) !== null) {
    cells.set(mm[1], mm[2].replace(/<[^>]+>/g, "").trim())
  }
  console.log("All data-stats in row 1:")
  for (const [k, v] of cells.entries()) {
    console.log(`  ${k} = ${v}`)
  }
}
main().catch(console.error)
