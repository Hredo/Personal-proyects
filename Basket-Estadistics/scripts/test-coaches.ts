import { listCoaches, groupCoachesByTeam } from "../src/lib/data/staff"

async function main() {
  const all = await listCoaches()
  console.log(`Total coaches: ${all.length}`)
  const groups = groupCoachesByTeam(all)
  console.log(`Teams: ${groups.length}`)
  for (const g of groups.slice(0, 4)) {
    console.log(`\n${g.team.name} (${g.league.name})`)
    for (const c of g.coaches) {
      console.log(`  - ${c.role.padEnd(15)} ${c.fullName} (${c.nationality ?? "?"})`)
    }
  }

  console.log("\n--- Filtered by ACB head_coach only ---")
  const acb = await listCoaches({ league: "acb", role: "head_coach" })
  for (const c of acb) console.log(`  ${c.fullName} (${c.team.name})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
