import { eq, sql } from "drizzle-orm"
import { getDb, closeDb } from "@/lib/db/client"
import {
  coaches,
  leagues,
  playerSeasonStats,
  players,
  seasons,
  syncRuns,
  teamSeasonStats,
  teams,
} from "@/lib/db/schema"
import type { SourceAdapter, SourceId } from "@/lib/sources/types"
import { slugify, uniqueSlug } from "@/lib/sync/slug"

function scorePlayerRecord(p: {
  imageUrl: string | null
  nationality: string | null
  position: string | null
  heightCm: number | null
  weightKg: number | null
}): number {
  let s = 0
  if (p.imageUrl) s += 10
  if (p.nationality) s += 5
  if (p.position) s += 3
  if (p.heightCm) s += 1
  if (p.weightKg) s += 1
  return s
}

export type SyncResult = {
  source: SourceId
  status: "ok" | "failed"
  durationMs: number
  rowsWritten: number
  error?: string
  totals: {
    teams: number
    players: number
    stats: number
    coaches: number
    teamStats: number
  }
}

export async function runSync(adapter: SourceAdapter): Promise<SyncResult> {
  const db = getDb()
  const startedAt = new Date()
  const started = Date.now()
  const [run] = await db
    .insert(syncRuns)
    .values({
      source: adapter.id,
      startedAt,
      status: "running",
      rowsWritten: 0,
    })
    .returning()

  const totals = { teams: 0, players: 0, stats: 0, coaches: 0, teamStats: 0 }

  try {
    /* ---- League ---- */
    const leagueSlug = adapter.id
    const [league] = await db
      .insert(leagues)
      .values({
        name: adapter.displayName,
        slug: leagueSlug,
        region: adapter.country,
      })
      .onConflictDoUpdate({
        target: leagues.slug,
        set: { name: adapter.displayName, region: adapter.country },
      })
      .returning()
    const leagueId = league.id

    /* ---- Season ---- */
    const [existingSeason] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.name, adapter.seasonCode))
      .limit(1)
    let seasonId: string
    if (existingSeason) {
      seasonId = existingSeason.id
    } else {
      const [inserted] = await db
        .insert(seasons)
        .values({ name: adapter.seasonCode, isCurrent: true })
        .returning()
      seasonId = inserted.id
    }

    /* ---- Teams ---- */
    const sourceTeams = await adapter.fetchTeams()
    const existingTeams = await db.select().from(teams)
    const teamBySlug = new Map(existingTeams.map((t) => [t.slug, t]))
    const usedTeamSlugs = new Set(existingTeams.map((t) => t.slug))
    const teamIdBySourceId = new Map<string, string>()

    for (const st of sourceTeams) {
      const baseSlug = slugify(st.name) || `team-${st.sourceId}`
      let row = teamBySlug.get(baseSlug)
      if (!row) {
        const slug = uniqueSlug(baseSlug, usedTeamSlugs)
        const [inserted] = await db
          .insert(teams)
          .values({
            name: st.name,
            slug,
            city: st.city ?? null,
            logoUrl: st.logoUrl ?? null,
          })
          .returning()
        row = inserted
        teamBySlug.set(slug, row)
      }
      teamIdBySourceId.set(st.sourceId, row.id)
      totals.teams++
    }

    /* ---- Players ---- */
    const sourcePlayers = await adapter.fetchPlayers()
    const existingPlayerRows = await db.select().from(players)
    const existingPlayersBySlug = new Map(
      existingPlayerRows.map((p) => [p.slug, p]),
    )
    const existingPlayersByName = new Map<
      string,
      (typeof existingPlayerRows)[number]
    >()
    for (const p of existingPlayerRows) {
      const key = `${p.firstName} ${p.lastName}`.toLowerCase().trim().replace(/\s+/g, " ")
      const prior = existingPlayersByName.get(key)
      if (!prior) {
        existingPlayersByName.set(key, p)
        continue
      }
      const priorScore = scorePlayerRecord(prior)
      const nextScore = scorePlayerRecord(p)
      if (nextScore > priorScore) {
        existingPlayersByName.set(key, p)
      }
    }
    const usedPlayerSlugs = new Set(existingPlayerRows.map((p) => p.slug))

    const playerIdBySourceId = new Map<string, string>()
    for (const sp of sourcePlayers) {
      const nameKey = sp.fullName.toLowerCase().trim().replace(/\s+/g, " ")
      const matchByName = existingPlayersByName.get(nameKey)
      const parts = sp.fullName.trim().split(/\s+/)
      const firstName = parts[0] ?? ""
      const lastName = parts.slice(1).join(" ") || firstName
      const baseSlug = slugify(sp.fullName) || `player-${sp.sourceId}`
      const sourceScopedSlug = `${adapter.id}-${baseSlug}`
      const slug = uniqueSlug(sourceScopedSlug, usedPlayerSlugs)
      const existing = existingPlayersBySlug.get(slug)
      const fillIns: Partial<typeof players.$inferInsert> = {}

      if (sp.photoUrl) fillIns.imageUrl = sp.photoUrl
      if (sp.nationality) fillIns.nationality = sp.nationality
      if (sp.position) fillIns.position = sp.position
      if (sp.heightCm) fillIns.heightCm = sp.heightCm
      if (sp.weightKg) fillIns.weightKg = sp.weightKg

      if (existing) {
        if (Object.keys(fillIns).length > 0) {
          await db
            .update(players)
            .set(fillIns)
            .where(eq(players.id, existing.id))
        }
        playerIdBySourceId.set(sp.sourceId, existing.id)
        totals.players++
        continue
      }

      if (matchByName) {
        const existingLeague = matchByName.slug.split("-")[0]
        const isFebLeague = ["leb-oro", "leb-plata", "eba"].includes(adapter.id)
        const existingIsFeb = ["leb-oro", "leb-plata", "eba"].includes(existingLeague ?? "")
        const isNba = adapter.id === "nba"
        const existingIsNba = existingLeague === "nba"
        if (
          (isFebLeague && existingIsNba) ||
          (isNba && existingIsFeb)
        ) {
          const [row] = await db
            .insert(players)
            .values({
              firstName, lastName, slug,
              nationality: sp.nationality ?? null,
              position: sp.position ?? null,
              heightCm: sp.heightCm ?? null,
              weightKg: sp.weightKg ?? null,
              imageUrl: sp.photoUrl ?? null,
            })
            .returning()
          playerIdBySourceId.set(sp.sourceId, row.id)
          usedPlayerSlugs.add(slug)
          existingPlayersByName.set(nameKey, row)
          totals.players++
          continue
        }
        if (Object.keys(fillIns).length > 0) {
          await db
            .update(players)
            .set(fillIns)
            .where(eq(players.id, matchByName.id))
        }
        playerIdBySourceId.set(sp.sourceId, matchByName.id)
        totals.players++
        continue
      }

      const [row] = await db
        .insert(players)
        .values({
          firstName,
          lastName,
          slug,
          nationality: sp.nationality ?? null,
          position: sp.position ?? null,
          heightCm: sp.heightCm ?? null,
          weightKg: sp.weightKg ?? null,
          imageUrl: sp.photoUrl ?? null,
          ...fillIns,
        })
        .returning()
      playerIdBySourceId.set(sp.sourceId, row.id)
      usedPlayerSlugs.add(slug)
      existingPlayersByName.set(nameKey, row)
      totals.players++
    }

    /* ---- Player Stats ---- */
    const sourceStats = await adapter.fetchStats()
    for (const s of sourceStats) {
      const playerId = playerIdBySourceId.get(s.playerSourceId)
      if (!playerId) continue
      const teamId = s.teamSourceId
        ? (teamIdBySourceId.get(s.teamSourceId) ?? null)
        : null
      if (!teamId) continue
      await db
        .insert(playerSeasonStats)
        .values({
          playerId,
          teamId,
          leagueId,
          seasonId,
          gamesPlayed: s.gamesPlayed,
          minutesTotal: s.minutesTotal,
          pointsTotal: s.pointsTotal,
          reboundsTotal: s.reboundsTotal,
          assistsTotal: s.assistsTotal,
          stealsTotal: s.stealsTotal,
          blocksTotal: s.blocksTotal,
          fgMade: s.fgMade,
          fgAttempted: s.fgAttempted,
          threeMade: s.threeMade,
          threeAttempted: s.threeAttempted,
          ftMade: s.ftMade,
          ftAttempted: s.ftAttempted,
          offensiveRebounds: s.offensiveRebounds,
          defensiveRebounds: s.defensiveRebounds,
          foulsTotal: s.foulsTotal,
          plusMinus: s.plusMinus,
          per: s.per,
          trueShootingPct: s.trueShootingPct,
          winShares: s.winShares,
          bpm: s.bpm,
        })
        .onConflictDoUpdate({
          target: [
            playerSeasonStats.playerId,
            playerSeasonStats.teamId,
            playerSeasonStats.leagueId,
            playerSeasonStats.seasonId,
          ],
          set: {
            gamesPlayed: s.gamesPlayed,
            minutesTotal: s.minutesTotal,
            pointsTotal: s.pointsTotal,
            reboundsTotal: s.reboundsTotal,
            assistsTotal: s.assistsTotal,
            stealsTotal: s.stealsTotal,
            blocksTotal: s.blocksTotal,
            fgMade: s.fgMade,
            fgAttempted: s.fgAttempted,
            threeMade: s.threeMade,
            threeAttempted: s.threeAttempted,
            ftMade: s.ftMade,
            ftAttempted: s.ftAttempted,
            offensiveRebounds: s.offensiveRebounds,
            defensiveRebounds: s.defensiveRebounds,
            foulsTotal: s.foulsTotal,
            plusMinus: s.plusMinus,
            per: s.per,
            trueShootingPct: s.trueShootingPct,
            winShares: s.winShares,
            bpm: s.bpm,
          },
        })
      totals.stats++
    }

    /* ---- Coaches ---- */
    const sourceCoaches = await adapter.fetchCoaches()
    const usedCoachSlugs = new Set<string>()
    for (const sc of sourceCoaches) {
      const teamId = sc.teamSourceId
        ? (teamIdBySourceId.get(sc.teamSourceId) ?? null)
        : null
      if (!teamId) continue
      const baseSlug = sc.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "coach"
      const slug = (() => {
        let candidate = baseSlug
        let i = 2
        while (usedCoachSlugs.has(candidate)) {
          candidate = `${baseSlug}-${i++}`
        }
        usedCoachSlugs.add(candidate)
        return candidate
      })()
      await db
        .insert(coaches)
        .values({
          leagueId,
          teamId,
          fullName: sc.fullName,
          slug,
          role: sc.role,
          nationality: sc.nationality ?? null,
          age: sc.age ?? null,
          photoUrl: sc.photoUrl ?? null,
        })
        .onConflictDoUpdate({
          target: [coaches.teamId, coaches.leagueId, coaches.slug],
          set: {
            fullName: sc.fullName,
            role: sc.role,
            nationality: sc.nationality ?? null,
            age: sc.age ?? null,
            photoUrl: sc.photoUrl ?? null,
          },
        })
      totals.coaches++
    }

    /* ---- Team Stats ---- */
    const sourceTeamStats = await adapter.fetchTeamStats()
    for (const ts of sourceTeamStats) {
      const teamId = teamIdBySourceId.get(ts.teamSourceId)
      if (!teamId) continue
      await db
        .insert(teamSeasonStats)
        .values({
          teamId,
          seasonId,
          leagueId,
          gamesPlayed: ts.gamesPlayed,
          wins: ts.wins,
          losses: ts.losses,
          winPct: ts.winPct ?? null,
          pointsFor: ts.pointsFor ?? null,
          pointsAgainst: ts.pointsAgainst ?? null,
          position: ts.position ?? null,
          pace: ts.pace ?? null,
          offRtg: ts.offRtg ?? null,
          defRtg: ts.defRtg ?? null,
          netRtg: ts.netRtg ?? null,
          sos: ts.sos ?? null,
        })
        .onConflictDoUpdate({
          target: [
            teamSeasonStats.teamId,
            teamSeasonStats.seasonId,
            teamSeasonStats.leagueId,
          ],
          set: {
            gamesPlayed: ts.gamesPlayed,
            wins: ts.wins,
            losses: ts.losses,
            winPct: ts.winPct ?? null,
            pointsFor: ts.pointsFor ?? null,
            pointsAgainst: ts.pointsAgainst ?? null,
            position: ts.position ?? null,
            pace: ts.pace ?? null,
            offRtg: ts.offRtg ?? null,
            defRtg: ts.defRtg ?? null,
            netRtg: ts.netRtg ?? null,
            sos: ts.sos ?? null,
          },
        })
      totals.teamStats++
    }

    /* ---- Finalize ---- */
    const rowsWritten =
      totals.teams +
      totals.players +
      totals.stats +
      totals.coaches +
      totals.teamStats
    const finishedAt = new Date()
    await db
      .update(syncRuns)
      .set({ finishedAt, status: "ok", rowsWritten })
      .where(eq(syncRuns.id, run.id))

    return {
      source: adapter.id,
      status: "ok",
      durationMs: Date.now() - started,
      rowsWritten,
      totals,
    }
  } catch (err) {
    const finishedAt = new Date()
    const message = err instanceof Error ? err.message : String(err)
    await db
      .update(syncRuns)
      .set({ finishedAt, status: "failed", error: message })
      .where(eq(syncRuns.id, run.id))
    return {
      source: adapter.id,
      status: "failed",
      durationMs: Date.now() - started,
      rowsWritten: 0,
      error: message,
      totals,
    }
  }
}

export function summarizeDb() {
  const db = getDb()
  return Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(leagues),
    db.select({ count: sql<number>`count(*)` }).from(teams),
    db.select({ count: sql<number>`count(*)` }).from(players),
    db.select({ count: sql<number>`count(*)` }).from(playerSeasonStats),
    db.select({ count: sql<number>`count(*)` }).from(coaches),
    db.select({ count: sql<number>`count(*)` }).from(teamSeasonStats),
  ]).then(([l, t, p, s, c, ts]) => ({
    leagues: Number(l[0]?.count ?? 0),
    teams: Number(t[0]?.count ?? 0),
    players: Number(p[0]?.count ?? 0),
    stats: Number(s[0]?.count ?? 0),
    coaches: Number(c[0]?.count ?? 0),
    teamStats: Number(ts[0]?.count ?? 0),
  }))
}

export function shutdown() {
  closeDb()
}
