async function main() {
  for (const year of ["2024", "2025", "2026"]) {
    const url = `https://www.basketball-reference.com/international/spain-liga-acb/${year}_per_game.html`
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      },
      redirect: "manual",
    })
    console.log(`${url}: ${res.status}`)
    if (res.ok) {
      const html = await res.text()
      const ids = [...html.matchAll(/<table[^>]*\bid="([^"]+)"/g)].map(
        (m) => m[1],
      )
      console.log(`  table ids:`, ids)
    }
  }
}
main().catch(console.error)
