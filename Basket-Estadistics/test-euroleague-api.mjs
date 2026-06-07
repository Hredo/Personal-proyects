// Try EuroLeague official API
const res = await fetch(
  "https://api.euroleague.net/people/v1/players?Season=2024",
  {
    headers: { "User-Agent": "Mozilla/5.0" },
  },
)
console.log("Status:", res.status)
if (res.ok) {
  const json = await res.json()
  console.log("Type:", Array.isArray(json) ? "array" : typeof json)
  if (Array.isArray(json)) {
    console.log("Length:", json.length)
    console.log("Sample:", JSON.stringify(json[0], null, 2))
  } else {
    console.log("Sample:", JSON.stringify(json).substring(0, 1000))
  }
}
