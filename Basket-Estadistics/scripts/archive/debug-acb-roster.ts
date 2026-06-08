async function main() {
  const url = "https://www.acb.com/es/liga/equipos/asisa-joventut-8/plantilla"
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
  const re = /self\.__next_f\.push\(\[\s*1\s*,\s*"((?:[^"\\]|\\.)*)"\s*\]\)/g
  const chunks: string[] = []
  let m: RegExpExecArray | null
  function unescape(s: string): string {
    return s
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
  }
  while ((m = re.exec(html)) !== null) chunks.push(unescape(m[1] ?? ""))
  const rsc = chunks.join("")
  // Find players
  const playersIdx = rsc.indexOf('"players":[')
  if (playersIdx === -1) {
    console.log("No players found")
    return
  }
  console.log("Players at:", playersIdx)
  console.log(
    "Sample player data:",
    rsc.substring(playersIdx, playersIdx + 1000),
  )
}
main().catch(console.error)
