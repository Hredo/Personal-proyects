import pLimit from "p-limit"
import { eq, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import {
  coaches,
  leagues,
  playerSeasonStats,
  players,
  seasons,
  syncRuns,
  teams,
} from "@/lib/db/schema"
import { SOURCES, SOURCE_IDS } from "@/lib/sources"
import type {
  ExtractedPlayerStat,
  SourceAdapter,
  SourceId,
  SourceTeam,
} from "@/lib/sources/types"
import { EntityMatcher, type MatcherStats } from "@/lib/sync/entity-matcher"
import { revalidateCacheTags } from "@/lib/sync/revalidate"
import { slugify, uniqueSlug } from "@/lib/sync/slug"

/**
 * Central ingestion orchestrator: runs every league adapter (NBA, EuroLeague,
 * ACB and the three FEB competitions) through the same pipeline —
 * scrape → entity-match players via Ollama → ensure teams → upsert stats.
 *
 * Concurrency is capped at 2 leagues so the Neon connection pool stays calm
 * and no source sees a burst of parallel traffic. Seasons, teams and the
 * player identity registry are shared across the parallel jobs, which is what
 * keeps a multi-league player (e.g. Edy Tavares) on a single players row.
 */

const MAX_CONCURRENT_LEAGUES = 2

export type LeagueSyncTotals = {
  teams: number
  playersCreated: number
  playersReused: number
  statsUpserted: number
  statsSkipped: number
  coaches: number
}

export type LeagueSyncResult = {
  source: SourceId
  league: string
  status: "ok" | "failed"
  durationMs: number
  rowsWritten: number
  error?: string
  totals: LeagueSyncTotals
}

export type GlobalSyncReport = {
  durationMs: number
  results: LeagueSyncResult[]
  matcherStats: MatcherStats
}

type Db = ReturnType<typeof getDb>

type SyncContext = {
  db: Db
  matcher: EntityMatcher
  usedPlayerSlugs: Set<string>
  ensureSeason(code: string): Promise<string>
  ensureTeam(team: SourceTeam): Promise<string>
}

function emptyTotals(): LeagueSyncTotals {
  return {
    teams: 0,
    playersCreated: 0,
    playersReused: 0,
    statsUpserted: 0,
    statsSkipped: 0,
    coaches: 0,
  }
}

function statColumns(s: ExtractedPlayerStat) {
  return {
    gamesPlayed: s.gamesPlayed,
    minutesTotal: s.minutesTotal,
    pointsTotal: s.pointsTotal,
    reboundsTotal: s.reboundsTotal,
    assistsTotal: s.assistsTotal,
    stealsTotal: s.stealsTotal,
    blocksTotal: s.blocksTotal,
    turnoversTotal: s.turnoversTotal,
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
  }
}

async function syncLeague(
  adapter: SourceAdapter,
  ctx: SyncContext,
): Promise<LeagueSyncResult> {
  const { db, matcher } = ctx
  const tag = `[${adapter.displayName}]`
  const started = Date.now()
  const totals = emptyTotals()

  const [run] = await db
    .insert(syncRuns)
    .values({ source: adapter.id, status: "running", rowsWritten: 0 })
    .returning()

  try {
    console.log(`${tag} sync started (season ${adapter.seasonCode})`)

    /* ---- League & season ---- */
    const [league] = await db
      .insert(leagues)
      .values({
        name: adapter.displayName,
        slug: adapter.id,
        region: adapter.country,
      })
      .onConflictDoUpdate({
        target: leagues.slug,
        set: { name: adapter.displayName, region: adapter.country },
      })
      .returning()
    const leagueId = league.id
    const seasonId = await ctx.ensureSeason(adapter.seasonCode)

    /* ---- Teams ---- */
    const sourceTeams = await adapter.fetchTeams()
    const teamIdBySourceId = new Map<string, string>()
    for (const st of sourceTeams) {
      teamIdBySourceId.set(st.sourceId, await ctx.ensureTeam(st))
    }
    totals.teams = teamIdBySourceId.size
    console.log(`${tag} teams ready (${totals.teams})`)

    /* ---- Players (entity matching) ---- */
    const sourcePlayers = await adapter.fetchPlayers()
    const playerIdBySourceId = new Map<string, string>()
    for (const sp of sourcePlayers) {
      const decision = await matcher.resolve({
        fullName: sp.fullName,
        league: adapter.displayName,
        nationality: sp.nationality,
        position: sp.position,
        heightCm: sp.heightCm,
      })

      if (decision.kind === "existing") {
        const fillIns: Partial<typeof players.$inferInsert> = {}
        if (sp.photoUrl) fillIns.imageUrl = sp.photoUrl
        if (sp.nationality) fillIns.nationality = sp.nationality
        if (sp.position) fillIns.position = sp.position
        if (sp.heightCm) fillIns.heightCm = sp.heightCm
        if (sp.weightKg) fillIns.weightKg = sp.weightKg
        if (Object.keys(fillIns).length > 0) {
          await db
            .update(players)
            .set(fillIns)
            .where(eq(players.id, decision.playerId))
        }
        playerIdBySourceId.set(sp.sourceId, decision.playerId)
        totals.playersReused++
        continue
      }

      const parts = sp.fullName.trim().split(/\s+/)
      const firstName = parts[0] ?? ""
      const lastName = parts.slice(1).join(" ") || firstName
      const baseSlug = slugify(sp.fullName) || `player-${sp.sourceId}`
      const slug = uniqueSlug(baseSlug, ctx.usedPlayerSlugs)

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
        })
        .returning()
      matcher.register({
        id: row.id,
        fullName: sp.fullName,
        nationality: sp.nationality ?? null,
        position: sp.position ?? null,
        heightCm: sp.heightCm ?? null,
      })
      playerIdBySourceId.set(sp.sourceId, row.id)
      totals.playersCreated++
    }
    console.log(
      `${tag} players resolved (${sourcePlayers.length} — ` +
        `${totals.playersCreated} new / ${totals.playersReused} reused)`,
    )

    /* ---- Player season stats ---- */
    const sourceStats = await adapter.fetchStats()
    for (const stat of sourceStats) {
      const playerId = playerIdBySourceId.get(stat.playerSourceId)
      const teamId = stat.teamSourceId
        ? teamIdBySourceId.get(stat.teamSourceId)
        : undefined
      if (!playerId || !teamId) {
        totals.statsSkipped++
        continue
      }
      await db
        .insert(playerSeasonStats)
        .values({ playerId, teamId, leagueId, seasonId, ...statColumns(stat) })
        .onConflictDoUpdate({
          target: [
            playerSeasonStats.playerId,
            playerSeasonStats.teamId,
            playerSeasonStats.leagueId,
            playerSeasonStats.seasonId,
          ],
          set: statColumns(stat),
        })
      totals.statsUpserted++
    }
    console.log(
      `${tag} stats upserted (${totals.statsUpserted}, skipped ${totals.statsSkipped})`,
    )

    /* ---- Coaches ---- */
    const sourceCoaches = await adapter.fetchCoaches()
    // Same inline slug as run.ts (no accent stripping) so upserts land on the
    // coach rows previous syncs created instead of inserting near-duplicates.
    const usedCoachSlugs = new Set<string>()
    for (const sc of sourceCoaches) {
      const teamId = sc.teamSourceId
        ? teamIdBySourceId.get(sc.teamSourceId)
        : undefined
      if (!teamId) continue
      const baseSlug =
        sc.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "coach"
      let coachSlug = baseSlug
      let i = 2
      while (usedCoachSlugs.has(coachSlug)) coachSlug = `${baseSlug}-${i++}`
      usedCoachSlugs.add(coachSlug)
      await db
        .insert(coaches)
        .values({
          leagueId,
          teamId,
          fullName: sc.fullName,
          slug: coachSlug,
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
            // Keep whatever a previous sync already filled when this source
            // has no value, instead of regressing the column to null.
            nationality: sql`coalesce(excluded.nationality, ${coaches.nationality})`,
            age: sql`coalesce(excluded.age, ${coaches.age})`,
            photoUrl: sql`coalesce(excluded.photo_url, ${coaches.photoUrl})`,
          },
        })
      totals.coaches++
    }
    console.log(`${tag} coaches upserted (${totals.coaches})`)

    /* ---- Finalize ---- */
    const rowsWritten =
      totals.teams +
      totals.playersCreated +
      totals.playersReused +
      totals.statsUpserted +
      totals.coaches
    await db
      .update(syncRuns)
      .set({ finishedAt: new Date(), status: "ok", rowsWritten })
      .where(eq(syncRuns.id, run.id))

    const durationMs = Date.now() - started
    console.log(`${tag} ✓ done in ${(durationMs / 1000).toFixed(1)}s`)
    return {
      source: adapter.id,
      league: adapter.displayName,
      status: "ok",
      durationMs,
      rowsWritten,
      totals,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const durationMs = Date.now() - started
    console.error(
      `${tag} ✗ FAILED after ${(durationMs / 1000).toFixed(1)}s — ${message}`,
    )
    try {
      await db
        .update(syncRuns)
        .set({ finishedAt: new Date(), status: "failed", error: message })
        .where(eq(syncRuns.id, run.id))
    } catch {
      console.error(`${tag} could not record the failure in sync_runs`)
    }
    return {
      source: adapter.id,
      league: adapter.displayName,
      status: "failed",
      durationMs,
      rowsWritten: 0,
      error: message,
      totals,
    }
  }
}

export async function startGlobalSync(
  targets: SourceId[] = SOURCE_IDS,
): Promise<GlobalSyncReport> {
  const started = Date.now()
  const db = getDb()

  console.log(
    `[orchestrator] global sync starting — leagues: ${targets.join(", ")} · ` +
      `concurrency: ${MAX_CONCURRENT_LEAGUES}`,
  )

  /* ---- Shared state: identity registry, slugs, team & season caches ---- */
  const existingPlayers = await db.select().from(players)
  const matcher = new EntityMatcher(
    existingPlayers.map((p) => ({
      id: p.id,
      fullName: `${p.firstName} ${p.lastName}`.trim(),
      nationality: p.nationality,
      position: p.position,
      heightCm: p.heightCm,
    })),
  )
  const usedPlayerSlugs = new Set(existingPlayers.map((p) => p.slug))
  console.log(
    `[orchestrator] entity matcher primed with ${existingPlayers.length} known players · ` +
      `ollama ${matcher.llmAvailable ? "available" : "unavailable (deterministic fallback)"}`,
  )

  const existingTeams = await db
    .select({
      id: teams.id,
      slug: teams.slug,
      city: teams.city,
      logoUrl: teams.logoUrl,
    })
    .from(teams)
  const teamStateBySlug = new Map(
    existingTeams.map((t) => [
      t.slug,
      { id: t.id, city: t.city, logoUrl: t.logoUrl },
    ]),
  )
  const teamPromises = new Map<string, Promise<string>>()
  const seasonPromises = new Map<string, Promise<string>>()

  const ctx: SyncContext = {
    db,
    matcher,
    usedPlayerSlugs,
    // Memoized get-or-create so two leagues syncing in parallel can never
    // insert the same season ("2025-26" is shared by NBA, ACB and FEB).
    ensureSeason(code) {
      let pending = seasonPromises.get(code)
      if (!pending) {
        pending = (async () => {
          // The DB currently holds duplicate season rows per name (legacy
          // syncs); deterministically converge on the one with most stats.
          const existing = (await db.execute(
            sql`
              SELECT s.id
              FROM seasons s
              LEFT JOIN player_season_stats p ON p.season_id = s.id
              WHERE s.name = ${code}
              GROUP BY s.id
              ORDER BY count(p.id) DESC, s.id
              LIMIT 1
            `,
          )) as unknown as { id: string }[]
          if (existing[0]) return existing[0].id
          const [inserted] = await db
            .insert(seasons)
            .values({ name: code, isCurrent: true })
            .returning()
          return inserted.id
        })()
        seasonPromises.set(code, pending)
      }
      return pending
    },
    async ensureTeam(team) {
      const slug = slugify(team.name) || `team-${team.sourceId}`
      let pending = teamPromises.get(slug)
      if (!pending) {
        pending = (async () => {
          const cached = teamStateBySlug.get(slug)
          if (cached) return cached.id
          const [row] = await db
            .insert(teams)
            .values({
              name: team.name,
              slug,
              city: team.city ?? null,
              logoUrl: team.logoUrl ?? null,
            })
            .onConflictDoUpdate({
              target: teams.slug,
              set: { name: team.name },
            })
            .returning()
          teamStateBySlug.set(slug, {
            id: row.id,
            city: row.city,
            logoUrl: row.logoUrl,
          })
          return row.id
        })()
        teamPromises.set(slug, pending)
      }
      const id = await pending
      // Each league gets a chance to fill fields the others left null.
      const state = teamStateBySlug.get(slug)
      if (state) {
        const fills: Partial<typeof teams.$inferInsert> = {}
        if (team.city && !state.city) fills.city = team.city
        if (team.logoUrl && !state.logoUrl) fills.logoUrl = team.logoUrl
        if (Object.keys(fills).length > 0) {
          await db.update(teams).set(fills).where(eq(teams.id, id))
          Object.assign(state, fills)
        }
      }
      return id
    },
  }

  /* ---- Run all leagues, max 2 at a time ---- */
  const limit = pLimit(MAX_CONCURRENT_LEAGUES)
  const results = await Promise.all(
    targets.map((id) => limit(() => syncLeague(SOURCES[id], ctx))),
  )

  /* ---- Summary ---- */
  const durationMs = Date.now() - started
  const okCount = results.filter((r) => r.status === "ok").length
  console.log("[orchestrator] ── summary ──")
  for (const r of results) {
    console.log(
      r.status === "ok"
        ? `[orchestrator] ${r.league.padEnd(14)} ok     ${String(r.rowsWritten).padStart(6)} rows  ${(r.durationMs / 1000).toFixed(1)}s`
        : `[orchestrator] ${r.league.padEnd(14)} FAILED ${r.error}`,
    )
  }
  const ms = matcher.stats
  console.log(
    `[orchestrator] entity matcher — exact: ${ms.exactMatches} · ` +
      `no-candidates: ${ms.noCandidates} · ` +
      `ollama: ${ms.llmExisting + ms.llmNew} decisions (${ms.llmExisting} matched / ${ms.llmNew} new) · ` +
      `heuristic: ${ms.heuristicFallbacks} · errors: ${ms.llmErrors}`,
  )
  console.log(
    `[orchestrator] global sync finished in ${(durationMs / 1000).toFixed(1)}s — ` +
      `${okCount}/${results.length} leagues ok`,
  )

  if (okCount > 0) await revalidateCacheTags()

  return { durationMs, results, matcherStats: { ...matcher.stats } }
}
