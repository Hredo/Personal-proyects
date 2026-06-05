// Check what fields the NBA leaguedashplayerbiostats endpoint returns
const res = await fetch(
  "https://stats.nba.com/stats/leaguedashplayerbiostats?Season=2025-26&SeasonType=Regular+Season&LeagueID=00&PerMode=PerGame",
  {
    headers: {
      Referer: "https://www.nba.com/",
      "User-Agent": "Mozilla/5.0",
    },
  },
)
const json = await res.json()
const set = json.resultSets.find((rs) => rs.name === "LeagueDashPlayerBioStats")
console.log("Headers:", set.headers.join(","))
const sample = set.rowSet[0]
const obj = {}
for (let i = 0; i < set.headers.length; i++) obj[set.headers[i]] = sample[i]
console.log("Sample:", JSON.stringify(obj, null, 2))
