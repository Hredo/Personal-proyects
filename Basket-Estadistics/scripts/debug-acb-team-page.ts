async function main() {
  const url = "https://www.acb.com/es/liga/equipos/club?id=2&season=2025-26"
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    },
  })
  if (!res.ok) {
    console.log("Error:", res.status)
    return
  }
  const html = await res.text()
  const ids = [...html.matchAll(/<table[^>]*\bid="([^"]+)"/g)].map((m) => m[1])
  console.log("Tables:", ids)
  // Look for stats-related data
  if (html.includes("pts_per_g") || html.includes("puntos")) {
    console.log("Has points data")
  }
  // Check size
  console.log("HTML length:", html.length)
}
main().catch(console.error)
