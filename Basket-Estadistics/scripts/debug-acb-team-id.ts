async function main() {
  const clubId = 8
  const res = await fetch("https://www.acb.com/es/liga/equipos", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    },
  })
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
  // Find the slug for clubId 8
  const teamPattern = new RegExp(`"clubId":${clubId}[\\s\\S]{0,500}`)
  const teamMatch = rsc.match(teamPattern)
  if (!teamMatch) {
    console.log("Team not found")
    return
  }
  console.log("Team data:", teamMatch[0].slice(0, 300))
  // Extract slug
  const slugMatch = teamMatch[0].match(/"slug":\s*"([^"]+)"/)
  console.log("Slug:", slugMatch?.[1])
  if (slugMatch) {
    const url = `https://www.acb.com/es/liga/equipos/${slugMatch[1]}/plantilla`
    console.log("Roster URL:", url)
  }
}
main().catch(console.error)
