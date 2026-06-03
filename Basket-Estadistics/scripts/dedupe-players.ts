import { eq, inArray, sql } from "drizzle-orm"
import { getDb, closeDb } from "../src/lib/db/client"
import { playerStats, players } from "../src/lib/db/schema"

type PlayerRow = typeof players.$inferSelect

async function main() {
  const db = getDb()

  const allPlayers = await db.select().from(players)

  const groups = new Map<string, PlayerRow[]>()
  for (const p of allPlayers) {
    const key = p.fullName.toLowerCase().trim().replace(/\s+/g, " ")
    const existing = groups.get(key) ?? []
    existing.push(p)
    groups.set(key, existing)
  }

  let mergedGroups = 0
  let deletedRecords = 0
  let reassignedStats = 0

  for (const [name, group] of groups) {
    if (group.length === 1) continue

    const ids = group.map((p) => p.id)
    const statRows = await db
      .select({
        id: playerStats.id,
        playerId: playerStats.playerId,
        gamesPlayed: playerStats.gamesPlayed,
        teamId: playerStats.teamId,
      })
      .from(playerStats)
      .where(inArray(playerStats.playerId, ids))

    const statsByPlayer = new Map<string, typeof statRows>()
    for (const s of statRows) {
      const list = statsByPlayer.get(s.playerId) ?? []
      list.push(s)
      statsByPlayer.set(s.playerId, list)
    }

    const teamFrequency = new Map<string, number>()
    for (const s of statRows) {
      if (s.teamId) {
        teamFrequency.set(s.teamId, (teamFrequency.get(s.teamId) ?? 0) + s.gamesPlayed)
      }
    }
    const dominantTeamId = Array.from(teamFrequency.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0] ?? null

    const scored = group.map((p) => {
      const stats = statsByPlayer.get(p.id) ?? []
      const totalGames = stats.reduce((sum, s) => sum + (s.gamesPlayed ?? 0), 0)
      const statsCount = stats.length
      const updatedAt =
        p.updatedAt instanceof Date ? p.updatedAt.getTime() : Number(p.updatedAt ?? 0)
      return {
        player: p,
        totalGames,
        statsCount,
        updatedAt,
        score:
          totalGames * 100 +
          statsCount * 20 +
          (p.photoUrl ? 10 : 0) +
          (p.nationality ? 5 : 0) +
          (p.position ? 3 : 0) +
          (p.birthdate ? 2 : 0) +
          (p.heightCm ? 1 : 0),
      }
    })

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.updatedAt - a.updatedAt
    })

    const winner = scored[0]
    const losers = scored.slice(1)
    const primary = winner.player

    for (const loser of losers) {
      const dupStats = statsByPlayer.get(loser.player.id) ?? []
      for (const s of dupStats) {
        const teamId = s.teamId ?? dominantTeamId
        await db
          .update(playerStats)
          .set({ playerId: primary.id, teamId })
          .where(eq(playerStats.id, s.id))
        reassignedStats++
      }
    }

    const fillIns: Partial<typeof players.$inferInsert> = {}
    if (!primary.photoUrl) {
      const photo = losers.find((l) => l.player.photoUrl)?.player.photoUrl
      if (photo) fillIns.photoUrl = photo
    }
    if (!primary.nationality) {
      const n = losers.find((l) => l.player.nationality)?.player.nationality
      if (n) fillIns.nationality = n
    }
    if (!primary.position) {
      const pos = losers.find((l) => l.player.position)?.player.position
      if (pos) fillIns.position = pos
    }
    if (!primary.birthdate) {
      const bd = losers.find((l) => l.player.birthdate)?.player.birthdate
      if (bd) fillIns.birthdate = bd
    }
    if (!primary.heightCm) {
      const h = losers.find((l) => l.player.heightCm)?.player.heightCm
      if (h) fillIns.heightCm = h
    }
    if (!primary.weightKg) {
      const w = losers.find((l) => l.player.weightKg)?.player.weightKg
      if (w) fillIns.weightKg = w
    }
    if (!primary.currentTeamId && dominantTeamId) {
      fillIns.currentTeamId = dominantTeamId
    }
    if (Object.keys(fillIns).length > 0) {
      await db.update(players).set(fillIns).where(eq(players.id, primary.id))
    }

    for (const loser of losers) {
      await db.delete(players).where(eq(players.id, loser.player.id))
      deletedRecords++
    }

    mergedGroups++
    console.log(
      `[${name}] kept=${primary.slug} (source=${primary.source}, team=${dominantTeamId ?? "—"}) removed=${losers
        .map((l) => l.player.slug)
        .join(", ")}`,
    )
  }

  console.log(
    `\nMerged ${mergedGroups} duplicate group(s); deleted ${deletedRecords} record(s); reassigned ${reassignedStats} stat row(s).`,
  )

  const remaining = await db
    .select({ count: sql<number>`count(*)` })
    .from(players)
  console.log(`Remaining players: ${remaining[0]?.count ?? 0}`)

  closeDb()
}

main().catch((err) => {
  console.error(err)
  closeDb()
  process.exit(1)
})
