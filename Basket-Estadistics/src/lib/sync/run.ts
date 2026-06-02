import { eq, sql } from "drizzle-orm"
import { getDb, closeDb } from "@/lib/db/client"
import {
  coaches,
  leagues,
  playerStats,
  players,
  seasons,
  syncRuns,
  teamSeasonStats,
  teams,
} from "@/lib/db/schema"
import type { SourceAdapter, SourceId } from "@/lib/sources/types"
import { slugify, uniqueSlug } from "@/lib/sync/slug"

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

export async function runSync(
  adapter: SourceAdapter,
): Promise<SyncResult> {
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
    const existingLeague = await db
      .select()
      .from(leagues)
      .where(eq(leagues.source, adapter.id))
      .limit(1)

    let leagueId: string
    if (existingLeague[0]) {
      leagueId = existingLeague[0].id
    } else {
      const leagueSlug = adapter.id
      const [inserted] = await db
        .insert(leagues)
        .values({
          name: adapter.displayName,
          slug: leagueSlug,
          country: adapter.country,
          source: adapter.id,
        })
        .returning()
      leagueId = inserted.id
    }

    const existingSeason = await db
      .select()
      .from(seasons)
      .where(eq(seasons.leagueId, leagueId))
      .limit(50)

    let seasonId: string
    const matched = existingSeason.find((s) => s.year === adapter.season)
    if (matched) {
      seasonId = matched.id
    } else {
      const [insertedSeason] = await db
        .insert(seasons)
        .values({
          leagueId,
          year: adapter.season,
          name: adapter.seasonCode,
        })
        .returning()
      seasonId = insertedSeason.id
    }

    const sourceTeams = await adapter.fetchTeams()
    const existingTeamRows = await db
      .select()
      .from(teams)
      .where(eq(teams.leagueId, leagueId))
    const existingTeamsBySourceId = new Map(
      existingTeamRows.map((t) => [t.sourceId, t]),
    )
    const usedSlugs = new Set(existingTeamRows.map((t) => t.slug))

    const teamIdBySourceId = new Map<string, string>()
    for (const t of sourceTeams) {
      const existing = existingTeamsBySourceId.get(t.sourceId)
      const slug = existing?.slug ?? uniqueSlug(t.name, usedSlugs)
      const [row] = await db
        .insert(teams)
        .values({
          leagueId,
          sourceId: t.sourceId,
          name: t.name,
          slug,
          country: t.country,
          logoUrl: t.logoUrl,
          shortName: t.shortName ?? null,
          city: t.city ?? null,
          foundedYear: t.foundedYear ?? null,
          arena: t.arena ?? null,
          arenaCapacity: t.arenaCapacity ?? null,
          websiteUrl: t.websiteUrl ?? null,
          primaryColor: t.primaryColor ?? null,
        })
        .onConflictDoUpdate({
          target: [teams.leagueId, teams.sourceId],
          set: {
            name: t.name,
            country: t.country,
            logoUrl: t.logoUrl,
            shortName: t.shortName ?? null,
            city: t.city ?? null,
            foundedYear: t.foundedYear ?? null,
            arena: t.arena ?? null,
            arenaCapacity: t.arenaCapacity ?? null,
            websiteUrl: t.websiteUrl ?? null,
            primaryColor: t.primaryColor ?? null,
          },
        })
        .returning()
      teamIdBySourceId.set(t.sourceId, row.id)
      totals.teams++
    }

    const sourcePlayers = await adapter.fetchPlayers()
    const existingPlayerRows = await db
      .select()
      .from(players)
      .where(eq(players.source, adapter.id))
    const existingPlayersBySourceId = new Map(
      existingPlayerRows.map((p) => [p.sourceId, p]),
    )
    const usedPlayerSlugs = new Set<string>()
    for (const p of existingPlayerRows) {
      usedPlayerSlugs.add(p.slug)
    }

    const playerIdBySourceId = new Map<string, string>()
    const now = new Date()
    for (const p of sourcePlayers) {
      const existing = existingPlayersBySourceId.get(p.sourceId)
      const baseSlug = slugify(p.fullName) || p.sourceId
      const sourceScopedSlug = `${adapter.id}-${baseSlug}`
      const slug = existing?.slug ?? uniqueSlug(sourceScopedSlug, usedPlayerSlugs)
      const teamId = p.teamSourceId
        ? teamIdBySourceId.get(p.teamSourceId) ?? null
        : null
      const [row] = await db
        .insert(players)
        .values({
          fullName: p.fullName,
          slug,
          birthdate: p.birthdate,
          nationality: p.nationality,
          position: p.position,
          heightCm: p.heightCm,
          weightKg: p.weightKg,
          currentTeamId: teamId,
          photoUrl: p.photoUrl,
          source: adapter.id,
          sourceId: p.sourceId,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [players.source, players.sourceId],
          set: {
            fullName: p.fullName,
            birthdate: p.birthdate,
            nationality: p.nationality,
            position: p.position,
            heightCm: p.heightCm,
            weightKg: p.weightKg,
            currentTeamId: teamId,
            photoUrl: p.photoUrl,
            updatedAt: now,
          },
        })
        .returning()
      playerIdBySourceId.set(p.sourceId, row.id)
      totals.players++
    }

    const sourceStats = await adapter.fetchStats()
    const seen = new Set<string>()
    for (const s of sourceStats) {
      const playerId = playerIdBySourceId.get(s.playerSourceId)
      if (!playerId) continue
      const teamId = s.teamSourceId
        ? teamIdBySourceId.get(s.teamSourceId) ?? null
        : null
      await db
        .insert(playerStats)
        .values({
          playerId,
          seasonId,
          teamId,
          gamesPlayed: s.gamesPlayed,
          minutesPerGame: s.minutesPerGame ?? null,
          points: s.points ?? null,
          rebounds: s.rebounds ?? null,
          assists: s.assists ?? null,
          steals: s.steals ?? null,
          blocks: s.blocks ?? null,
          turnovers: s.turnovers ?? null,
          fgPct: s.fgPct ?? null,
          threePct: s.threePct ?? null,
          ftPct: s.ftPct ?? null,
          offRtg: null,
          defRtg: null,
          per: null,
          winShares: null,
          bpm: null,
        })
        .onConflictDoUpdate({
          target: [playerStats.playerId, playerStats.seasonId],
          set: {
            teamId,
            gamesPlayed: s.gamesPlayed,
            minutesPerGame: s.minutesPerGame ?? null,
            points: s.points ?? null,
            rebounds: s.rebounds ?? null,
            assists: s.assists ?? null,
            steals: s.steals ?? null,
            blocks: s.blocks ?? null,
            turnovers: s.turnovers ?? null,
            fgPct: s.fgPct ?? null,
            threePct: s.threePct ?? null,
            ftPct: s.ftPct ?? null,
          },
        })
      const key = `${playerId}:${seasonId}`
      if (!seen.has(key)) {
        seen.add(key)
        totals.stats++
      }
    }

    const sourceCoaches = await adapter.fetchCoaches()
    const usedCoachSlugs = new Set<string>()
    for (const c of sourceCoaches) {
      const teamId = c.teamSourceId
        ? teamIdBySourceId.get(c.teamSourceId) ?? null
        : null
      if (!teamId) continue
      const baseSlug =
        c.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || c.sourceId
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
          fullName: c.fullName,
          slug,
          role: c.role,
          nationality: c.nationality ?? null,
          age: c.age ?? null,
          photoUrl: c.photoUrl ?? null,
          licenseType: c.licenseType ?? null,
          source: adapter.id,
          sourceId: c.sourceId,
        })
        .onConflictDoUpdate({
          target: [coaches.source, coaches.sourceId],
          set: {
            teamId,
            fullName: c.fullName,
            slug,
            role: c.role,
            nationality: c.nationality ?? null,
            age: c.age ?? null,
            photoUrl: c.photoUrl ?? null,
            licenseType: c.licenseType ?? null,
          },
        })
      totals.coaches++
    }

    const sourceTeamStats = await adapter.fetchTeamStats()
    for (const ts of sourceTeamStats) {
      const teamId = teamIdBySourceId.get(ts.teamSourceId)
      if (!teamId) continue
      await db
        .insert(teamSeasonStats)
        .values({
          teamId,
          seasonId,
          gamesPlayed: ts.gamesPlayed,
          wins: ts.wins,
          losses: ts.losses,
          winPct: ts.winPct ?? null,
          pointsFor: ts.pointsFor ?? null,
          pointsAgainst: ts.pointsAgainst ?? null,
          pace: ts.pace ?? null,
          offRtg: ts.offRtg ?? null,
          defRtg: ts.defRtg ?? null,
          netRtg: ts.netRtg ?? null,
          sos: ts.sos ?? null,
        })
        .onConflictDoUpdate({
          target: [teamSeasonStats.teamId, teamSeasonStats.seasonId],
          set: {
            gamesPlayed: ts.gamesPlayed,
            wins: ts.wins,
            losses: ts.losses,
            winPct: ts.winPct ?? null,
            pointsFor: ts.pointsFor ?? null,
            pointsAgainst: ts.pointsAgainst ?? null,
            pace: ts.pace ?? null,
            offRtg: ts.offRtg ?? null,
            defRtg: ts.defRtg ?? null,
            netRtg: ts.netRtg ?? null,
            sos: ts.sos ?? null,
          },
        })
      totals.teamStats++
    }

    const rowsWritten =
      totals.teams + totals.players + totals.stats + totals.coaches + totals.teamStats
    const finishedAt = new Date()
    await db
      .update(syncRuns)
      .set({
        finishedAt,
        status: "ok",
        rowsWritten,
      })
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
      .set({
        finishedAt,
        status: "failed",
        error: message,
      })
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
    db.select({ count: sql<number>`count(*)` }).from(playerStats),
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
