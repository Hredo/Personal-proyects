import { acbAdapter } from "../../src/lib/sources/acb"

async function main() {
  console.log("Fetching ACB players (this hits 18 team pages)...")
  const players = await acbAdapter.fetchPlayers()
  console.log(`Got ${players.length} players`)
  for (const p of players.slice(0, 6)) {
    console.log(
      `  ${p.sourceId} ${p.fullName} - ${p.position ?? "?"} #${p.jerseyNumber ?? "?"} ${p.heightCm ?? "?"}cm (${p.nationality ?? "?"}) age ${p.age ?? "?"}`,
    )
  }

  console.log("\nFetching ACB coaches...")
  const coaches = await acbAdapter.fetchCoaches()
  console.log(`Got ${coaches.length} coaches`)
  for (const c of coaches.slice(0, 8)) {
    console.log(
      `  ${c.sourceId} ${c.fullName} - ${c.role} (${c.nationality ?? "?"}) age ${c.age ?? "?"}`,
    )
  }

  console.log("\nFetching ACB team stats...")
  const stats = await acbAdapter.fetchTeamStats()
  console.log(`Got ${stats.length} team stats`)
  for (const s of stats.slice(0, 5)) {
    console.log(
      `  ${s.teamSourceId} - pos ${s.position} W${s.wins} L${s.losses} (${s.pointsFor}-${s.pointsAgainst})`,
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
