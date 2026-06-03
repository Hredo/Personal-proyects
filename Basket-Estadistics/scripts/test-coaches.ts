import { listCoaches, groupCoachesByTeam } from "../src/lib/data/staff"

async function main() {
  const all = await listCoaches({ pageSize: 5000 })
  const items = all.items
  console.log(`Total coaches: ${all.total}`)
  const groups = groupCoachesByTeam(items)
  console.log(`Teams: ${groups.length}`)
  for (const g of groups.slice(0, 4)) {
    console.log(`\n${g.team.name} (${g.league.name})`)
    for (const c of g.coaches) {
      console.log(`  - ${c.role.padEnd(15)} ${c.fullName} (${c.nationality ?? "?"})`)
    }
  }

  console.log("\n--- Filtered by ACB head_coach only ---")
  const acb = await listCoaches({ league: "acb", role: "head_coach", pageSize: 100 })
  for (const c of acb.items) console.log(`  ${c.fullName} (${c.team.name})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
