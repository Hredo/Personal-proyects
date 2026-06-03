// Check team details endpoint
const res = await fetch(
  "https://stats.nba.com/stats/leaguestandingsv3?LeagueID=00&Season=2025-26&SeasonType=Regular+Season",
  {
    headers: { Referer: "https://www.nba.com/", "User-Agent": "Mozilla/5.0" },
  },
);
const json = await res.json();
const set = json.resultSets[0];
console.log("Headers:", set.headers.join(","));
const obj = {};
for (let i = 0; i < set.headers.length; i++) obj[set.headers[i]] = set.rowSet[0][i];
console.log("Sample:", JSON.stringify(obj, null, 2));

// Try commonteamyears / teamdetails
const res2 = await fetch(
  "https://stats.nba.com/stats/teamdetails?LeagueID=00&TeamID=1610612761",
  {
    headers: { Referer: "https://www.nba.com/", "User-Agent": "Mozilla/5.0" },
  },
);
const json2 = await res2.json();
console.log("\nTeamdetails sets:", json2.resultSets.map(s => s.name));
const set2 = json2.resultSets[0];
if (set2) {
  console.log("Headers:", set2.headers.join(","));
  const obj2 = {};
  for (let i = 0; i < set2.headers.length; i++) obj2[set2.headers[i]] = set2.rowSet[0][i];
  console.log("Sample:", JSON.stringify(obj2, null, 2));
}
