// Check commonplayerinfo endpoint
const res = await fetch(
  "https://stats.nba.com/stats/commonplayerinfo?LeagueID=00&PlayerID=1630639",
  {
    headers: {
      Referer: "https://www.nba.com/",
      "User-Agent": "Mozilla/5.0",
    },
  },
)
const json = await res.json()
console.log(
  "Result sets:",
  json.resultSets.map((s) => s.name),
)
const set = json.resultSets.find((rs) => rs.name === "CommonPlayerInfo")
if (set) {
  console.log("Headers:", set.headers.join(","))
  const obj = {}
  for (let i = 0; i < set.headers.length; i++)
    obj[set.headers[i]] = set.rowSet[0][i]
  console.log("Info:", JSON.stringify(obj, null, 2))
}
