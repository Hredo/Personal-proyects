async function main() {
  const brUrl = `https://www.basketball-reference.com/international/spain-liga-acb/2025_per_game.html`
  const res = await fetch(brUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    },
  })
  const html = await res.text()
  const m = html.match(/<table[^>]*\bid="per_game-stats-2025"[\s\S]*?<\/table>/)
  if (!m) return console.log("not found")
  const rows = m[0].match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) ?? []
  console.log("BR rows:", rows.length)
  for (let i = 0; i < 5; i++) {
    const cells = new Map<string, string>()
    const cellRe =
      /<t[hd]\b[^>]*\bdata-stat="([^"]+)"[^>]*>([\s\S]*?)<\/t[hd]>/g
    let mm: RegExpExecArray | null
    while ((mm = cellRe.exec(rows[i])) !== null) {
      cells.set(mm[1], mm[2].replace(/<[^>]+>/g, "").trim())
    }
    console.log(`  BR: "${cells.get("player")}"`)
  }

  const Database = (await import("better-sqlite3")).default
  const db = new Database("./data/basket.db")
  const players = db
    .prepare("SELECT full_name FROM players WHERE source = 'acb' LIMIT 10")
    .all()
  console.log("\nACB players:")
  for (const p of players) console.log(`  "${(p as any).full_name}"`)
  db.close()
}
main().catch(console.error)
