import type { TeamProfile } from "@/lib/data/teams"
import type { PlayerProfile } from "@/lib/data/players"
import { getPlayerBySlug } from "@/lib/data/players"
import { getDb } from "@/lib/db/client"
import { leagues, playerSeasonStats, players, teams } from "@/lib/db/schema"
import { and, asc, eq, like, or, sql, type SQL } from "drizzle-orm"
import { formatStat } from "@/lib/format"

export type Intent =
  | "defender"
  | "scorer"
  | "playmaker"
  | "wing"
  | "big"
  | "cheap"
  | "star"
  | "general"

export type Recruit = {
  name: string
  position: string
  league: "NBA" | "EuroLeague" | "ACB"
  age: number
  contractValue: string
  strengths: string[]
  fit: string
  market: string
}

export type AdvisorOutput = {
  intent: Intent
  intentLabel: string
  intentEmoji: string
  team: {
    name: string
    league: string
    leagueBadge: string
    rosterSize: number
    topPlayers: string[]
  }
  analysis: string
  gap: string
  recommendations: Array<Recruit & { priority: string; priorityColor: string }>
  considerations: string[]
}

const RECRUITS: Record<string, Recruit[]> = {
  defender: [
    {
      name: "Alex Caruso",
      position: "Guard",
      league: "NBA",
      age: 30,
      contractValue: "$9M",
      strengths: ["Elite perimeter defense", "Basketball IQ", "Steals"],
      fit: "Closes passing lanes, perimeter defensive anchor",
      market: "Free agent / MLE",
    },
    {
      name: "Marcus Smart",
      position: "Shooting guard",
      league: "NBA",
      age: 30,
      contractValue: "$18M",
      strengths: ["2022 Defensive Player of the Year", "Leadership", "Versatility"],
      fit: "Brings intensity and defensive communication",
      market: "Trade",
    },
    {
      name: "Jrue Holiday",
      position: "Point guard",
      league: "NBA",
      age: 34,
      contractValue: "$36M",
      strengths: ["Elite defense", "Playoff experience", "Two-way play"],
      fit: "Defensive point guard and competitive reference",
      market: "Trade",
    },
    {
      name: "Dyson Daniels",
      position: "Point guard",
      league: "NBA",
      age: 21,
      contractValue: "$7M",
      strengths: ["NBA steals leader", "2.03m length", "Energy"],
      fit: "Young defensive specialist with huge upside",
      market: "Re-sign",
    },
    {
      name: "Nicolas Batum",
      position: "Forward",
      league: "NBA",
      age: 35,
      contractValue: "$11M",
      strengths: ["Defensive versatility", "Experience", "Three-point shot"],
      fit: "Versatile veteran for the rotation",
      market: "Free agent",
    },
    {
      name: "Vincent Poirier",
      position: "Center",
      league: "EuroLeague",
      age: 30,
      contractValue: "€1.8M",
      strengths: ["Rim protection", "Rebounding", "Shot blocking"],
      fit: "Defensive interior anchor for the rotation",
      market: "Free agent",
    },
  ],
  scorer: [
    {
      name: "Buddy Hield",
      position: "Shooting guard",
      league: "NBA",
      age: 31,
      contractValue: "$21M",
      strengths: ["Elite outside shooting", "Volume", "7m range"],
      fit: "Opens up defenses with a quick three-point shot",
      market: "Trade",
    },
    {
      name: "Bogdan Bogdanovic",
      position: "Wing",
      league: "NBA",
      age: 31,
      contractValue: "$20M",
      strengths: ["Shot creation", "Pick and pop", "Experience"],
      fit: "Offense generator with European experience",
      market: "Free agent",
    },
    {
      name: "Khris Middleton",
      position: "Small forward",
      league: "NBA",
      age: 33,
      contractValue: "$33M",
      strengths: ["Mid-range", "Clutch scorer", "Size"],
      fit: "Secondary scorer for clutch situations",
      market: "Trade",
    },
    {
      name: "Malik Monk",
      position: "Shooting guard",
      league: "NBA",
      age: 26,
      contractValue: "$15M",
      strengths: ["Sixth man", "Jump shot", "Creation"],
      fit: "Scoring engine off the bench",
      market: "Free agent",
    },
    {
      name: "Dzanan Musa",
      position: "Small forward",
      league: "EuroLeague",
      age: 25,
      contractValue: "€3.5M",
      strengths: ["Pure scorer", "One-on-one", "Jump shot"],
      fit: "Scoring wing for a European rotation",
      market: "Available",
    },
  ],
  playmaker: [
    {
      name: "D'Angelo Russell",
      position: "Point guard",
      league: "NBA",
      age: 28,
      contractValue: "$19M",
      strengths: ["Pick and roll", "Three-point shot", "Creation"],
      fit: "Floor general with experience in modern systems",
      market: "Trade",
    },
    {
      name: "Mike Conley",
      position: "Point guard",
      league: "NBA",
      age: 36,
      contractValue: "$24M",
      strengths: ["Veteran floor general", "Shooting", "Leadership"],
      fit: "Mentor and starting playmaker, consummate professional",
      market: "Free agent",
    },
    {
      name: "Sergio Llull",
      position: "Shooting guard",
      league: "EuroLeague",
      age: 36,
      contractValue: "€2.5M",
      strengths: ["Clutch shooting", "Speed", "Experience"],
      fit: "Clutch veteran for the bench",
      market: "Re-sign",
    },
    {
      name: "Vasilije Micic",
      position: "Point guard",
      league: "EuroLeague",
      age: 30,
      contractValue: "€5M",
      strengths: ["Pick and roll", "Shooting", "NBA experience"],
      fit: "European point guard with NBA experience",
      market: "Trade",
    },
  ],
  wing: [
    {
      name: "Andrew Wiggins",
      position: "Small forward",
      league: "NBA",
      age: 29,
      contractValue: "$28M",
      strengths: ["Athleticism", "Perimeter defense", "Transition"],
      fit: "3&D with the motor to start",
      market: "Trade",
    },
    {
      name: "Tobias Harris",
      position: "Power forward",
      league: "NBA",
      age: 32,
      contractValue: "$39M",
      strengths: ["Mid-range", "Size", "Versatility"],
      fit: "Versatile forward for the four spot",
      market: "Free agent",
    },
    {
      name: "Kelly Oubre Jr.",
      position: "Small forward",
      league: "NBA",
      age: 28,
      contractValue: "$12M",
      strengths: ["Athleticism", "Jump shot", "Energy"],
      fit: "Athletic wing for small-ball lineups",
      market: "Free agent",
    },
    {
      name: "Mario Hezonja",
      position: "Small forward",
      league: "EuroLeague",
      age: 29,
      contractValue: "€4M",
      strengths: ["Size", "Shooting", "Versatility"],
      fit: "Complete European wing with NBA experience",
      market: "Free agent",
    },
  ],
  big: [
    {
      name: "Jonas Valanciunas",
      position: "Center",
      league: "NBA",
      age: 32,
      contractValue: "$18M",
      strengths: ["Offensive rebounding", "Post-up", "Size"],
      fit: "Classic center for the interior game",
      market: "Trade",
    },
    {
      name: "Al Horford",
      position: "Center",
      league: "NBA",
      age: 38,
      contractValue: "$9M",
      strengths: ["Outside shooting", "Defense", "Versatility"],
      fit: "Modern five with shooting, defense and experience",
      market: "Free agent / MLE",
    },
    {
      name: "Tibor Pleiss",
      position: "Center",
      league: "EuroLeague",
      age: 35,
      contractValue: "€2M",
      strengths: ["2.21m size", "Shooting", "Experience"],
      fit: "European center who can shoot",
      market: "Free agent",
    },
    {
      name: "Willy Hernangomez",
      position: "Center",
      league: "EuroLeague",
      age: 30,
      contractValue: "€1.5M",
      strengths: ["Post moves", "Rebounding", "Toughness"],
      fit: "Center with NBA and EuroLeague experience",
      market: "Free agent",
    },
  ],
  cheap: [
    {
      name: "Alex Len",
      position: "Center",
      league: "NBA",
      age: 31,
      contractValue: "Min",
      strengths: ["2.13m size", "Rim protection", "Rebounding"],
      fit: "Budget center for a short rotation",
      market: "Veteran minimum",
    },
    {
      name: "Lonnie Walker IV",
      position: "Shooting guard",
      league: "NBA",
      age: 25,
      contractValue: "Min",
      strengths: ["Athleticism", "Jump shot", "Highlights"],
      fit: "Young player with upside on a minimum deal",
      market: "Veteran minimum",
    },
    {
      name: "Juan Nuñez",
      position: "Point guard",
      league: "ACB",
      age: 20,
      contractValue: "€0.4M",
      strengths: ["Court vision", "Speed", "Potential"],
      fit: "Young Spanish point guard with NBA projection",
      market: "Low buy-out",
    },
  ],
  star: [
    {
      name: "Trae Young",
      position: "Point guard",
      league: "NBA",
      age: 26,
      contractValue: "$46M",
      strengths: ["Pick and roll", "Deep range", "Assists"],
      fit: "Offense-generating star",
      market: "Star trade",
    },
    {
      name: "Donovan Mitchell",
      position: "Shooting guard",
      league: "NBA",
      age: 28,
      contractValue: "$35M",
      strengths: ["Elite scorer", "Speed", "Clutch"],
      fit: "All-Star scoring guard",
      market: "Star trade",
    },
    {
      name: "Karl-Anthony Towns",
      position: "Center",
      league: "NBA",
      age: 29,
      contractValue: "$60M",
      strengths: ["Three-point shot", "Post-up", "Rebounding"],
      fit: "All-Star center with outside shooting",
      market: "Star trade",
    },
    {
      name: "Luka Doncic",
      position: "Point guard",
      league: "NBA",
      age: 25,
      contractValue: "$43M",
      strengths: ["MVP calibre", "Triple-doubles", "Creation"],
      fit: "Franchise-transforming talent, highest level",
      market: "Superstar trade only",
    },
  ],
}

const INTENT_META: Record<
  Intent,
  { label: string; emoji: string; color: string }
> = {
  defender: {
    label: "Defensive reinforcement",
    emoji: "🛡️",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  scorer: {
    label: "Scorer / shooter",
    emoji: "🎯",
    color: "from-orange-500/20 to-red-500/20",
  },
  playmaker: {
    label: "Floor general",
    emoji: "🎮",
    color: "from-purple-500/20 to-pink-500/20",
  },
  wing: {
    label: "Versatile wing",
    emoji: "💪",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  big: {
    label: "Interior reinforcement",
    emoji: "🏀",
    color: "from-amber-500/20 to-orange-500/20",
  },
  cheap: {
    label: "Budget option",
    emoji: "💰",
    color: "from-slate-500/20 to-zinc-500/20",
  },
  star: {
    label: "Star move",
    emoji: "⭐",
    color: "from-yellow-500/20 to-amber-500/20",
  },
  general: {
    label: "General analysis",
    emoji: "🏀",
    color: "from-brand-500/20 to-brand-400/20",
  },
}

function detectIntent(q: string): Intent {
  const s = q.toLowerCase()
  if (s.match(/defens|defender|defensor|stop|stoper|stopper/)) return "defender"
  if (s.match(/anot|tirador|scorer|scoring|puntos|3 puntos|triples/))
    return "scorer"
  if (s.match(/base|playmaker|director|point|asistente|generador|organizador/))
    return "playmaker"
  if (s.match(/ala|alero|wing|forward/)) return "wing"
  if (
    s.match(
      /p[ií]vot|pivot|center|interior|rebote|rebounder|post|aro|pintura|tap[oó]n|tablero/,
    )
  )
    return "big"
  if (s.match(/barato|econ[oó]mico|cheap|m[íi]nimo|low cost|salary cap/))
    return "cheap"
  if (s.match(/estrella|star|superstar|franquicia|all-star|mvp/)) return "star"
  return "general"
}

function getPositionBreakdown(
  roster: TeamProfile["roster"],
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const p of roster) {
    const pos = (p.position || "?").toUpperCase().charAt(0)
    counts[pos] = (counts[pos] || 0) + 1
  }
  return counts
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRecommendations(
  intent: Intent,
  count: number,
  league: string,
): Recruit[] {
  let pool: Recruit[]
  if (intent === "general") {
    const intents: Intent[] = ["defender", "scorer", "playmaker", "wing", "big"]
    pool = intents.flatMap((i) => RECRUITS[i] ?? [])
  } else {
    pool = RECRUITS[intent] ?? []
  }

  const lname = league.toLowerCase()
  if (lname.includes("nba")) {
    pool = pool.filter((r) => r.league === "NBA")
  } else if (lname.includes("euro")) {
    pool = [
      ...pool.filter((r) => r.league === "EuroLeague"),
      ...pool.filter((r) => r.league === "NBA").slice(0, 1),
    ]
  } else if (lname.includes("acb") || lname.includes("endesa")) {
    pool = [
      ...pool.filter((r) => r.league === "ACB"),
      ...pool.filter((r) => r.league === "EuroLeague").slice(0, 1),
      ...pool.filter((r) => r.league === "NBA").slice(0, 1),
    ]
  }

  return shuffle(pool).slice(0, count)
}

function analyzeTeamGaps(roster: TeamProfile["roster"]): string {
  const counts = getPositionBreakdown(roster)
  const total = roster.length
  if (total === 0) return "Not enough roster information available."

  const guards = (counts["G"] || 0) + (counts["1"] || 0) + (counts["2"] || 0)
  const wings = (counts["F"] || 0) + (counts["3"] || 0) + (counts["4"] || 0)
  const bigs = (counts["C"] || 0) + (counts["5"] || 0)

  const gaps: string[] = []
  if (guards / total < 0.3)
    gaps.push("Backcourt reinforcements (point guards and shooting guards)")
  if (wings / total < 0.25) gaps.push("Help at the forward spots")
  if (bigs / total < 0.2) gaps.push("Limited interior depth")
  if (gaps.length === 0)
    gaps.push("Well-balanced roster — any position is viable")

  return gaps[0]
}

function getLeagueBadge(league: string): string {
  const lname = league.toLowerCase()
  if (lname.includes("nba")) return "NBA"
  if (lname.includes("acb") || lname.includes("endesa")) return "ACB"
  return "EuroLeague"
}

export async function buildLocalAdvice(
  team: TeamProfile,
  userMessage: string,
): Promise<AdvisorOutput> {
  const specific = await findPlayerInQuery(userMessage)
  if (specific) {
    return buildPlayerSpecificAdvice(team, specific)
  }

  const intent = detectIntent(userMessage)
  const meta = INTENT_META[intent]
  const recs = pickRecommendations(intent, 3, team.league.name)
  const gap = analyzeTeamGaps(team.roster)

  const priorities = [
    {
      label: "High priority",
      color: "bg-brand-500/20 text-brand-300 border-brand-500/30",
    },
    {
      label: "Solid option",
      color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    {
      label: "Value bet",
      color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    },
  ]

  return {
    intent,
    intentLabel: meta.label,
    intentEmoji: meta.emoji,
    team: {
      name: team.name,
      league: team.league.name,
      leagueBadge: getLeagueBadge(team.league.name),
      rosterSize: team.roster.length,
      topPlayers: team.roster.slice(0, 4).map((p) => p.fullName),
    },
    analysis: `Your query targets a **${meta.label.toLowerCase()}**. Based on the current roster analysis, this signing could bring a differential profile to the rotation.`,
    gap,
    recommendations: recs.map((r, i) => ({
      ...r,
      priority: priorities[i].label,
      priorityColor: priorities[i].color,
    })),
    considerations: [
      "Check the salary cap space before opening negotiations",
      "Prioritise profiles that complement (not duplicate) your key players",
      "The market moves fast — values are current estimates",
      "Factor in the buy-out clause if the player is under contract",
    ],
  }
}

const QUERY_STOPWORDS = new Set([
  "que",
  "tal",
  "como",
  "es",
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "de",
  "del",
  "en",
  "por",
  "para",
  "con",
  "sin",
  "y",
  "o",
  "u",
  "a",
  "fit",
  "encaja",
  "encajaria",
  "ficharia",
  "fichaje",
  "jugador",
  "seria",
  "buena",
  "buen",
  "opcion",
  "opinion",
  "sobre",
  "tipo",
  "cual",
  "cuando",
  "donde",
  "este",
  "esta",
  "estos",
  "estas",
  "eso",
  "esa",
  "ese",
  "muy",
  "mas",
  "poco",
  "algo",
  "algun",
  "alguna",
  "alguno",
  "nada",
  "nadie",
  "nunca",
  "siempre",
  "puede",
  "podria",
  "deberia",
  "haria",
  "hace",
  "hacer",
  "tener",
  "tiene",
  "tenia",
  "habia",
  "ha",
  "han",
  "he",
  "hay",
  "del",
  "al",
  "lo",
  // English query words
  "the",
  "and",
  "for",
  "with",
  "without",
  "what",
  "which",
  "how",
  "would",
  "could",
  "should",
  "about",
  "think",
  "good",
  "great",
  "sign",
  "signing",
  "player",
  "team",
  "option",
  "want",
  "need",
  "looking",
  "strong",
  "best",
])

function tokenizeQuery(query: string): string[] {
  return query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !QUERY_STOPWORDS.has(t))
}

async function findPlayerInQuery(query: string): Promise<PlayerProfile | null> {
  const tokens = tokenizeQuery(query)
  if (tokens.length === 0) return null

  // Build a single combined query: every token must appear somewhere in the
  // player's full name (case-insensitive). This collapses the N round-trips
  // of the previous implementation into one DB hit.
  const db = getDb()
  const nameLower = sql<string>`lower(concat(${players.firstName}, ' ', ${players.lastName}))`

  // 1. Combined AND query: every token must match.
  const andConditions = tokens.map((t) => like(nameLower, `%${t}%`))
  let row: { slug: string; fullName: string } | undefined = await pickPlayer(
    db,
    and(...andConditions),
  )

  // 2. If nothing matched, try pairwise combinations of the first tokens
  //    (handles "Doncic", "Luka Doncic", "Doncic Luka" by matching any
  //    adjacent pair) and OR them together.
  if (!row && tokens.length >= 2) {
    const pairs: ReturnType<typeof like>[] = []
    for (let i = 0; i < tokens.length - 1; i++) {
      const pair = `%${tokens[i]}%${tokens[i + 1]}%`
      pairs.push(like(nameLower, pair))
    }
    row = await pickPlayer(db, or(...pairs))
  }

  // 3. Last resort: any single token.
  if (!row) {
    const orConditions = tokens.map((t) => like(nameLower, `%${t}%`))
    row = await pickPlayer(db, or(...orConditions))
  }

  if (!row) return null
  return getPlayerBySlug(row.slug)
}

async function pickPlayer(
  db: ReturnType<typeof getDb>,
  whereClause: SQL | undefined,
): Promise<{ slug: string; fullName: string } | undefined> {
  if (!whereClause) return undefined
  const rows = await db
    .select({
      slug: players.slug,
      fullName: sql<string>`${players.firstName} || ' ' || ${players.lastName}`,
    })
    .from(players)
    .innerJoin(playerSeasonStats, eq(playerSeasonStats.playerId, players.id))
    .innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
    .leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
    .where(whereClause)
    .orderBy(asc(sql`length(concat(${players.firstName}, ' ', ${players.lastName}))`))
    .limit(1)
  const r = rows[0]
  if (!r) return undefined
  return { slug: r.slug, fullName: r.fullName }
}

export { findPlayerInQuery, formatStat, estimateContractValue, getLeagueBadge }

function estimateContractValue(profile: PlayerProfile): string {
  const latest = profile.seasons[0]
  if (!latest || latest.pointsTotal === null || latest.gamesPlayed === 0) return "N/A"
  const ppg = latest.pointsTotal / latest.gamesPlayed
  if (ppg >= 25) return "Max / $50M+"
  if (ppg >= 20) return "All-Star / $30-50M"
  if (ppg >= 15) return "Starter / $15-25M"
  if (ppg >= 10) return "Rotation / $5-12M"
  if (ppg >= 5) return "Role / $1-4M"
  return "Minimum / <€1M"
}

function buildPlayerSpecificAdvice(
  team: TeamProfile,
  profile: PlayerProfile,
): AdvisorOutput {
  const latest = profile.seasons[0]
  const age = null as number | null

  const gp = latest?.gamesPlayed || 1
  const ppg = latest?.pointsTotal !== null && latest?.pointsTotal !== undefined ? latest.pointsTotal / gp : null
  const apg = latest?.assistsTotal !== null && latest?.assistsTotal !== undefined ? latest.assistsTotal / gp : null
  const rpg = latest?.reboundsTotal !== null && latest?.reboundsTotal !== undefined ? latest.reboundsTotal / gp : null
  const spg = latest?.stealsTotal !== null && latest?.stealsTotal !== undefined ? latest.stealsTotal / gp : null
  const bpg = latest?.blocksTotal !== null && latest?.blocksTotal !== undefined ? latest.blocksTotal / gp : null

  const stats = latest
    ? [
        ppg !== null ? `${formatStat(ppg)} PPG` : null,
        rpg !== null ? `${formatStat(rpg)} RPG` : null,
        apg !== null ? `${formatStat(apg)} APG` : null,
        spg !== null ? `${formatStat(spg)} SPG` : null,
        bpg !== null ? `${formatStat(bpg)} BPG` : null,
      ].filter(Boolean)
    : []

  const statsLine =
    stats.length > 0 ? stats.join(" · ") : "No season stats available"
  const currentTeam = profile.team?.name ?? "Free agent / no team"
  const leagueLine = `${profile.league.name}${profile.nationality ? ` · ${profile.nationality}` : ""}`

  const intent: Intent = "scorer"

  const strengths: string[] = []
  if (ppg !== null && ppg >= 15) {
    strengths.push("Proven scorer")
  }
  if (apg !== null && apg >= 5) {
    strengths.push("Playmaking")
  }
  if (rpg !== null && rpg >= 7) {
    strengths.push("Solid rebounder")
  }
  if (spg !== null && spg >= 1.5) {
    strengths.push("Creates steals")
  }
  if (bpg !== null && bpg >= 1) {
    strengths.push("Rim protection")
  }
  if (strengths.length === 0)
    strengths.push("Complementary profile", "Available via trade")

  const sameLeague = profile.league.slug === team.league.slug

  const fitParts: string[] = []
  if (sameLeague) {
    fitParts.push(
      `Already plays in ${profile.league.name}, so the adaptation would be immediate.`,
    )
  } else {
    fitParts.push(
      `Comes from ${profile.league.name} — needs an adaptation period to the ${team.league.name} game.`,
    )
  }
  if (age !== null) {
    if (age <= 25)
      fitParts.push(`At ${age}, he is entering his highest-upside window.`)
    else if (age <= 30) fitParts.push(`At ${age}, he is in his prime.`)
    else
      fitParts.push(
        `At ${age}, he brings veteran presence and competitive experience.`,
      )
  }
  if (ppg !== null && ppg >= 18) {
    fitParts.push("Differential scorer — will take the key clutch possessions.")
  }

  const alternativeRecs = pickRecommendations(intent, 2, team.league.name)

  const alternative = (r: Recruit) => ({
    ...r,
    priority: "Alternative option",
    priorityColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  })

  return {
    intent,
    intentLabel: `Analysis of ${profile.fullName}`,
    intentEmoji: "🔍",
    team: {
      name: team.name,
      league: team.league.name,
      leagueBadge: getLeagueBadge(team.league.name),
      rosterSize: team.roster.length,
      topPlayers: team.roster.slice(0, 4).map((p) => p.fullName),
    },
    analysis: `**${profile.fullName}** (${profile.position ?? "Position N/A"}${age ? `, ${age} y/o` : ""}) currently at **${currentTeam}** (${leagueLine}). ${statsLine}. ${fitParts.join(" ")}`,
    gap: sameLeague
      ? `Direct fit with the ${team.league.name} roster`
      : `Cross-league fit: requires a salary review and adaptation to the ${team.league.name} system`,
    recommendations: [
      {
        name: profile.fullName,
        position: profile.position ?? "N/A",
        league: getLeagueBadge(profile.league.name) as
          | "NBA"
          | "EuroLeague"
          | "ACB",
        age: age ?? 0,
        contractValue: estimateContractValue(profile),
        strengths,
        fit: fitParts.join(" "),
        market: "Custom evaluation",
        priority: "Requested candidate",
        priorityColor: "bg-brand-500/20 text-brand-300 border-brand-500/30",
      },
      ...alternativeRecs.map(alternative),
    ],
    considerations: [
      `Check ${profile.fullName}'s current contract situation with ${currentTeam}`,
      sameLeague
        ? "Being in the same league, the salary fit and buy-out are more predictable"
        : "A cross-league move involves buy-out clauses and adaptation periods",
      "Compare his statistical profile against your current core before negotiating",
      "Consider the impact on the salary cap and locker-room chemistry",
    ],
  }
}
