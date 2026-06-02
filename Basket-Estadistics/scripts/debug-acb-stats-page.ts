async function main() {
  const urls = [
    "https://www.acb.com/es/liga/estadisticas",
    "https://www.acb.com/es/liga/jugadores",
    "https://www.acb.com/es/liga",
  ]
  for (const url of urls) {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      },
      redirect: "follow",
    })
    console.log(`${url}: ${res.status} ${res.url}`)
    if (res.ok) {
      const html = await res.text()
      console.log(`  length: ${html.length}`)
      // Check for stats
      if (html.includes("ranking") || html.includes("estadisticas")) {
        console.log(`  has 'ranking' or 'estadisticas'`)
      }
    }
  }
}
main().catch(console.error)
