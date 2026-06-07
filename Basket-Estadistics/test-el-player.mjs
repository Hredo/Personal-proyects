function parseHeightInchesToCm(s) {
  if (!s) return undefined
  const m = s.match(/(\d+)-(\d+)/)
  if (!m) return undefined
  return Math.round((Number(m[1]) * 12 + Number(m[2])) * 2.54)
}

function parseLbToKg(s) {
  if (!s) return undefined
  const m = s.match(/(\d+)\s*lb/)
  if (!m) return undefined
  return Math.round(Number(m[1]) * 0.453592)
}

function parseEuroLeaguePlayerPage(html) {
  const out = {}
  const blockMatch = html.match(
    /<strong>\s*Position:\s*<\/strong>([\s\S]{0,2500}?)<\/p>/i,
  )
  if (blockMatch) {
    const block = blockMatch[1]
    const posMatch = block.match(/^\s*([A-Za-z\-\/,\s]+?)\s*(?=<|$)/)
    if (posMatch) out.position = posMatch[1].replace(/\s+/g, " ").trim()
    const inchMatch = block.match(/<span>\s*(\d+\-\d+)\s*<\/span>/)
    if (inchMatch) {
      const cm = parseHeightInchesToCm(inchMatch[1])
      if (cm) out.heightCm = cm
    }
    const lbMatch = block.match(/<span>\s*(\d+)\s*lb\s*<\/span>/i)
    if (lbMatch) {
      const kg = parseLbToKg(`${lbMatch[1]}lb`)
      if (kg) out.weightKg = kg
    }
  }
  const bMatch = html.match(/data-birth="([^"]+)"/)
  if (bMatch) out.birthdate = bMatch[1]
  const natMatch = html.match(
    /<strong>\s*Born:\s*<\/strong>[\s\S]{0,2000}?in\s+([A-Za-z\s,\-]+?)\s*<\/span>/i,
  )
  if (natMatch) {
    const place = natMatch[1]
    const parts = place.split(",").map((p) => p.trim())
    out.nationality = parts[parts.length - 1] || place
  }
  return out
}

async function test() {
  const ids = [
    "mario-hezonja-1",
    "luka-doncic-1",
    "nikola-mirotic-1",
    "shane-larkin-1",
    "alperen-sengun-1",
    "kyle-kurkman-1",
    "maccabi",
  ]
  for (const id of ids) {
    const res = await fetch(
      `https://www.basketball-reference.com/international/players/${id}.html`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
      },
    )
    if (!res.ok) {
      console.log(`${id}: ${res.status}`)
      continue
    }
    const html = await res.text()
    console.log(`${id}:`, parseEuroLeaguePlayerPage(html))
    await new Promise((r) => setTimeout(r, 200))
  }
}

test().catch(console.error)
