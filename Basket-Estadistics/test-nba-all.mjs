// Check commonallplayers endpoint
const res = await fetch(
  "https://stats.nba.com/stats/commonallplayers?LeagueID=00&Season=2025-26&IsOnlyCurrentSeason=1",
  {
    headers: {
      Referer: "https://www.nba.com/",
      "User-Agent": "Mozilla/5.0",
    },
  },
);
const json = await res.json();
const set = json.resultSets[0];
console.log("Headers:", set.headers.join(","));
console.log("Count:", set.rowSet.length);
const obj = {};
for (let i = 0; i < set.headers.length; i++) obj[set.headers[i]] = set.rowSet[0][i];
console.log("Sample:", JSON.stringify(obj, null, 2));
