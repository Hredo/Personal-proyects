async function main() {
  const url = "https://www.basketball-reference.com/leagues/NBA_2025.html"
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    },
  })
  const html = await res.text()
  const ids = [...html.matchAll(/<table[^>]*\bid="([^"]+)"/g)].map((m) => m[1])
  console.log("NBA 2025 table ids:", ids)
  const perGame = html.match(/<table[^>]*\bid="per_game-team"[\s\S]*?<\/table>/)
  if (perGame) {
    const rows = perGame[0].match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) ?? []
    console.log("per_game-team rows:", rows.length)
    console.log("first row:", rows[0]?.slice(0, 500))
    console.log("second row:", rows[1]?.slice(0, 500))
  } else {
    console.log("per_game-team not found")
  }
}
main().catch(console.error)
