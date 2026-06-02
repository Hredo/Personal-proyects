import { acbAdapter } from "../src/lib/sources/acb"

async function main() {
  console.log("Fetching ACB teams only...")
  const teams = await acbAdapter.fetchTeams()
  console.log(`Got ${teams.length} teams`)
  for (const t of teams) {
    console.log(`  ${t.sourceId} ${t.name} (${t.shortName}) - founded ${t.foundedYear ?? "?"} arena ${t.arena ?? "?"}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
