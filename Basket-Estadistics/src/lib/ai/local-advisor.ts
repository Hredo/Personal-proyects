import type { TeamProfile } from "@/lib/data/teams"
import type { PlayerListItem, PlayerProfile } from "@/lib/data/players"
import { getPlayerBySlug } from "@/lib/data/players"
import { getDb } from "@/lib/db/client"
import { leagues, players, teams } from "@/lib/db/schema"
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
      position: "Base/Escolta",
      league: "NBA",
      age: 30,
      contractValue: "$9M",
      strengths: ["Defensa perimetral elite", "IQ baloncestístico", "Robos"],
      fit: "Cierra líneas de pase, ancla defensiva perimetral",
      market: "Libre / MLE",
    },
    {
      name: "Marcus Smart",
      position: "Escolta",
      league: "NBA",
      age: 30,
      contractValue: "$18M",
      strengths: ["Defensor del año 2022", "Liderazgo", "Versatilidad"],
      fit: "Aporta intensidad y comunicación defensiva",
      market: "Traspaso",
    },
    {
      name: "Jrue Holiday",
      position: "Base",
      league: "NBA",
      age: 34,
      contractValue: "$36M",
      strengths: ["Defensa de élite", "Experiencia playoffs", "Doble vía"],
      fit: "Base defensivo y referente competitivo",
      market: "Traspaso",
    },
    {
      name: "Dyson Daniels",
      position: "Base",
      league: "NBA",
      age: 21,
      contractValue: "$7M",
      strengths: ["Líder en robos NBA", "Longitud 2.03m", "Energía"],
      fit: "Especialista defensivo joven con gran proyección",
      market: "Renovación",
    },
    {
      name: "Nicolas Batum",
      position: "Ala",
      league: "NBA",
      age: 35,
      contractValue: "$11M",
      strengths: ["Versatilidad defensiva", "Experiencia", "Triple"],
      fit: "Veterano polivalente para rotations",
      market: "Libre",
    },
    {
      name: "Vincent Poirier",
      position: "Pívot",
      league: "EuroLeague",
      age: 30,
      contractValue: "€1.8M",
      strengths: ["Protección de aro", "Rebote", "Taponador"],
      fit: "Ancla interior defensiva para la rotación",
      market: "Libre",
    },
  ],
  scorer: [
    {
      name: "Buddy Hield",
      position: "Escolta",
      league: "NBA",
      age: 31,
      contractValue: "$21M",
      strengths: ["Tiro exterior élite", "Volumen", "Rango 7m"],
      fit: "Abre defensas con tiro de tres rápido",
      market: "Traspaso",
    },
    {
      name: "Bogdan Bogdanovic",
      position: "Escolta/Ala",
      league: "NBA",
      age: 31,
      contractValue: "$20M",
      strengths: ["Creador de tiro", "Pick and pop", "Experiencia"],
      fit: "Generador de offense con experiencia europea",
      market: "Libre",
    },
    {
      name: "Khris Middleton",
      position: "Alero",
      league: "NBA",
      age: 33,
      contractValue: "$33M",
      strengths: ["Mid-range", "Clutch scorer", "Tamaño"],
      fit: "Anotador secundario en situaciones clutch",
      market: "Traspaso",
    },
    {
      name: "Malik Monk",
      position: "Escolta",
      league: "NBA",
      age: 26,
      contractValue: "$15M",
      strengths: ["Sexto hombre", "Tiro en suspensión", "Creación"],
      fit: "Motor de anotación desde el banquillo",
      market: "Libre",
    },
    {
      name: "Dzanan Musa",
      position: "Alero",
      league: "EuroLeague",
      age: 25,
      contractValue: "€3.5M",
      strengths: ["Anotador puro", "1x1", "Tiro en suspensión"],
      fit: "Ala anotadora para rotación europea",
      market: "Disponible",
    },
  ],
  playmaker: [
    {
      name: "D'Angelo Russell",
      position: "Base",
      league: "NBA",
      age: 28,
      contractValue: "$19M",
      strengths: ["Pick and roll", "Tiro de tres", "Creación"],
      fit: "Base director con experiencia en sistemas modernos",
      market: "Traspaso",
    },
    {
      name: "Mike Conley",
      position: "Base",
      league: "NBA",
      age: 36,
      contractValue: "$24M",
      strengths: ["Director veterano", "Tiro", "Liderazgo"],
      fit: "Mentor y director titular, gran profesional",
      market: "Libre",
    },
    {
      name: "Sergio Llull",
      position: "Escolta",
      league: "EuroLeague",
      age: 36,
      contractValue: "€2.5M",
      strengths: ["Tiro clutch", "Velocidad", "Experiencia"],
      fit: "Veterano clutch para banquillo",
      market: "Renovación",
    },
    {
      name: "Vasilije Micic",
      position: "Base",
      league: "EuroLeague",
      age: 30,
      contractValue: "€5M",
      strengths: ["Pick and roll", "Tiro", "Experiencia NBA"],
      fit: "Base europeo con experiencia en la NBA",
      market: "Traspaso",
    },
  ],
  wing: [
    {
      name: "Andrew Wiggins",
      position: "Alero",
      league: "NBA",
      age: 29,
      contractValue: "$28M",
      strengths: ["Atlético", "Defensa perimetral", "Transición"],
      fit: "3&D con motor para ser titular",
      market: "Traspaso",
    },
    {
      name: "Tobias Harris",
      position: "Ala-Pívot",
      league: "NBA",
      age: 32,
      contractValue: "$39M",
      strengths: ["Mid-range", "Tamaño", "Versatilidad"],
      fit: "Ala versátil para línea de cuatro",
      market: "Libre",
    },
    {
      name: "Kelly Oubre Jr.",
      position: "Alero",
      league: "NBA",
      age: 28,
      contractValue: "$12M",
      strengths: ["Atlético", "Tiro en suspensión", "Energía"],
      fit: "Ala atlética para pequeñas alineaciones",
      market: "Libre",
    },
    {
      name: "Mario Hezonja",
      position: "Alero",
      league: "EuroLeague",
      age: 29,
      contractValue: "€4M",
      strengths: ["Tamaño", "Tiro", "Versatilidad"],
      fit: "Alero europeo completo con experiencia NBA",
      market: "Libre",
    },
  ],
  big: [
    {
      name: "Jonas Valanciunas",
      position: "Pívot",
      league: "NBA",
      age: 32,
      contractValue: "$18M",
      strengths: ["Rebote ofensivo", "Post-up", "Tamaño"],
      fit: "Pívot clásico para juego interior",
      market: "Traspaso",
    },
    {
      name: "Al Horford",
      position: "Pívot",
      league: "NBA",
      age: 38,
      contractValue: "$9M",
      strengths: ["Tiro exterior", "Defensa", "Versatilidad"],
      fit: "5 moderno con tiro, defensa y experiencia",
      market: "Libre / MLE",
    },
    {
      name: "Tibor Pleiss",
      position: "Pívot",
      league: "EuroLeague",
      age: 35,
      contractValue: "€2M",
      strengths: ["Tamaño 2.21m", "Tiro", "Experiencia"],
      fit: "Pívot europeo con capacidad de tiro",
      market: "Libre",
    },
    {
      name: "Willy Hernangomez",
      position: "Pívot",
      league: "EuroLeague",
      age: 30,
      contractValue: "€1.5M",
      strengths: ["Post moves", "Rebote", "Acero español"],
      fit: "Pívot con experiencia NBA/EuroLeague",
      market: "Libre",
    },
  ],
  cheap: [
    {
      name: "Alex Len",
      position: "Pívot",
      league: "NBA",
      age: 31,
      contractValue: "Min",
      strengths: ["Tamaño 2.13m", "Protección de aro", "Rebote"],
      fit: "Pívot económico para rotación corta",
      market: "Veteran minimum",
    },
    {
      name: "Lonnie Walker IV",
      position: "Escolta",
      league: "NBA",
      age: 25,
      contractValue: "Min",
      strengths: ["Atlético", "Tiro en suspensión", "Highlights"],
      fit: "Joven con upside en contrato mínimo",
      market: "Veteran minimum",
    },
    {
      name: "Juan Nuñez",
      position: "Base",
      league: "ACB",
      age: 20,
      contractValue: "€0.4M",
      strengths: ["Visión de juego", "Velocidad", "Potencial"],
      fit: "Base español joven con proyección NBA",
      market: "Buy-out bajo",
    },
  ],
  star: [
    {
      name: "Trae Young",
      position: "Base",
      league: "NBA",
      age: 26,
      contractValue: "$46M",
      strengths: ["Pick and roll", "Tiro lejano", "Asistencias"],
      fit: "Estrella generadora de offense",
      market: "Traspaso estrella",
    },
    {
      name: "Donovan Mitchell",
      position: "Escolta",
      league: "NBA",
      age: 28,
      contractValue: "$35M",
      strengths: ["Anotador élite", "Velocidad", "Clutch"],
      fit: "Alá-pívot anotador All-Star",
      market: "Traspaso estrella",
    },
    {
      name: "Karl-Anthony Towns",
      position: "Pívot",
      league: "NBA",
      age: 29,
      contractValue: "$60M",
      strengths: ["Tiro de 3", "Post-up", "Rebote"],
      fit: "Pívot All-Star con tiro exterior",
      market: "Traspaso estrella",
    },
    {
      name: "Luka Doncic",
      position: "Base",
      league: "NBA",
      age: 25,
      contractValue: "$43M",
      strengths: ["MVP calibre", "Triple-doble", "Generación"],
      fit: "Franquicia transformadora, máximo nivel",
      market: "Solo superstar trade",
    },
  ],
}

const INTENT_META: Record<
  Intent,
  { label: string; emoji: string; color: string }
> = {
  defender: {
    label: "Refuerzo defensivo",
    emoji: "🛡️",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  scorer: {
    label: "Anotador / tirador",
    emoji: "🎯",
    color: "from-orange-500/20 to-red-500/20",
  },
  playmaker: {
    label: "Base organizador",
    emoji: "🎮",
    color: "from-purple-500/20 to-pink-500/20",
  },
  wing: {
    label: "Alero versátil",
    emoji: "💪",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  big: {
    label: "Refuerzo interior",
    emoji: "🏀",
    color: "from-amber-500/20 to-orange-500/20",
  },
  cheap: {
    label: "Opción económica",
    emoji: "💰",
    color: "from-slate-500/20 to-zinc-500/20",
  },
  star: {
    label: "Movimiento estrella",
    emoji: "⭐",
    color: "from-yellow-500/20 to-amber-500/20",
  },
  general: {
    label: "Análisis general",
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
  roster: PlayerListItem[],
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

function analyzeTeamGaps(roster: PlayerListItem[]): string {
  const counts = getPositionBreakdown(roster)
  const total = roster.length
  if (total === 0) return "No hay información suficiente de la plantilla."

  const guards = (counts["G"] || 0) + (counts["1"] || 0) + (counts["2"] || 0)
  const wings = (counts["F"] || 0) + (counts["3"] || 0) + (counts["4"] || 0)
  const bigs = (counts["C"] || 0) + (counts["5"] || 0)

  const gaps: string[] = []
  if (guards / total < 0.3)
    gaps.push("Refuerzos en posiciones exteriores (bases y escoltas)")
  if (wings / total < 0.25) gaps.push("Refuerzo en aletas y ala-pívots")
  if (bigs / total < 0.2) gaps.push("Profundidad interior limitada")
  if (gaps.length === 0)
    gaps.push("Plantilla bien balanceada, cualquier posición es viable")

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
      label: "Prioridad alta",
      color: "bg-brand-500/20 text-brand-300 border-brand-500/30",
    },
    {
      label: "Opción sólida",
      color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    {
      label: "Apuesta de valor",
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
    analysis: `Tu consulta se centra en un **${meta.label.toLowerCase()}**. Basándome en el análisis de la plantilla actual, esta incorporación podría aportar un perfil diferencial en la rotación.`,
    gap,
    recommendations: recs.map((r, i) => ({
      ...r,
      priority: priorities[i].label,
      priorityColor: priorities[i].color,
    })),
    considerations: [
      "Verifica el espacio salarial antes de iniciar negociaciones",
      "Prioriza perfiles que complementen (no dupliquen) a jugadores clave",
      "El mercado cambia rápido — los valores son estimaciones actuales",
      "Considera la cláusula de rescisión si el jugador está bajo contrato",
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
  const nameLower = sql<string>`lower(${players.fullName})`

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
      fullName: players.fullName,
      leagueSlug: leagues.slug,
    })
    .from(players)
    .innerJoin(leagues, eq(players.source, leagues.source))
    .leftJoin(teams, eq(players.currentTeamId, teams.id))
    .where(whereClause)
    // Prefer shorter names (e.g. "Luka Doncic" before "Luka Doncic Jr.").
    .orderBy(asc(sql`length(${players.fullName})`))
    .limit(1)
  const r = rows[0]
  if (!r) return undefined
  return { slug: r.slug, fullName: r.fullName }
}

export { findPlayerInQuery, formatStat, estimateContractValue, getLeagueBadge }

function estimateContractValue(profile: PlayerProfile): string {
  const latest = profile.seasons[0]
  if (!latest || latest.points === null) return "N/D"
  const ppg = latest.points
  if (ppg >= 25) return "Max / $50M+"
  if (ppg >= 20) return "All-Star / $30-50M"
  if (ppg >= 15) return "Titular / $15-25M"
  if (ppg >= 10) return "Rotación / $5-12M"
  if (ppg >= 5) return "Rol / $1-4M"
  return "Mínimo / <€1M"
}

function buildPlayerSpecificAdvice(
  team: TeamProfile,
  profile: PlayerProfile,
): AdvisorOutput {
  const latest = profile.seasons[0]
  const age = profile.birthdate
    ? Math.floor(
        (Date.now() - new Date(profile.birthdate).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null

  const stats = latest
    ? [
        latest.points !== null ? `${formatStat(latest.points)} PPG` : null,
        latest.rebounds !== null ? `${formatStat(latest.rebounds)} RPG` : null,
        latest.assists !== null ? `${formatStat(latest.assists)} APG` : null,
        latest.steals !== null ? `${formatStat(latest.steals)} SPG` : null,
        latest.blocks !== null ? `${formatStat(latest.blocks)} BPG` : null,
        latest.threePct !== null
          ? `${formatStat(latest.threePct, 1, "%")} 3P`
          : null,
        latest.fgPct !== null ? `${formatStat(latest.fgPct, 1, "%")} FG` : null,
      ].filter(Boolean)
    : []

  const statsLine =
    stats.length > 0 ? stats.join(" · ") : "Sin estadísticas de temporada"
  const currentTeam = profile.team?.name ?? "Agente libre / sin equipo"
  const leagueLine = `${profile.league.name}${profile.nationality ? ` · ${profile.nationality}` : ""}`

  const intent: Intent = "scorer"

  const strengths: string[] = []
  if (
    latest?.points !== null &&
    latest?.points !== undefined &&
    latest.points >= 15
  ) {
    strengths.push("Anotador probado")
  }
  if (
    latest?.assists !== null &&
    latest?.assists !== undefined &&
    latest.assists >= 5
  ) {
    strengths.push("Generador de juego")
  }
  if (
    latest?.threePct !== null &&
    latest?.threePct !== undefined &&
    latest.threePct >= 36
  ) {
    strengths.push("Tiro exterior fiable")
  }
  if (
    latest?.rebounds !== null &&
    latest?.rebounds !== undefined &&
    latest.rebounds >= 7
  ) {
    strengths.push("Reboteador sólido")
  }
  if (
    latest?.steals !== null &&
    latest?.steals !== undefined &&
    latest.steals >= 1.5
  ) {
    strengths.push("Generador de robos")
  }
  if (
    latest?.blocks !== null &&
    latest?.blocks !== undefined &&
    latest.blocks >= 1
  ) {
    strengths.push("Protección de aro")
  }
  if (strengths.length === 0)
    strengths.push("Perfil complementario", "Disponible para traspaso")

  const sameLeague = profile.league.slug === team.league.slug

  const fitParts: string[] = []
  if (sameLeague) {
    fitParts.push(
      `Ya juega en ${profile.league.name} por lo que la adaptación sería inmediata.`,
    )
  } else {
    fitParts.push(
      `Proviene de ${profile.league.name} — requiere periodo de adaptación al sistema de ${team.league.name}.`,
    )
  }
  if (age !== null) {
    if (age <= 25)
      fitParts.push(`Con ${age} años entra en su ventana de mayor upside.`)
    else if (age <= 30) fitParts.push(`A los ${age} años está en su prime.`)
    else
      fitParts.push(
        `A los ${age} años aporta veteranía y experiencia competitiva.`,
      )
  }
  if (
    latest?.points !== null &&
    latest?.points !== undefined &&
    latest.points >= 18
  ) {
    fitParts.push("Marcador diferencial — asumirá posesiones clave en clutch.")
  }

  const alternativeRecs = pickRecommendations(intent, 2, team.league.name)

  const alternative = (r: Recruit) => ({
    ...r,
    priority: "Opción alternativa",
    priorityColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  })

  return {
    intent,
    intentLabel: `Análisis de ${profile.fullName}`,
    intentEmoji: "🔍",
    team: {
      name: team.name,
      league: team.league.name,
      leagueBadge: getLeagueBadge(team.league.name),
      rosterSize: team.roster.length,
      topPlayers: team.roster.slice(0, 4).map((p) => p.fullName),
    },
    analysis: `**${profile.fullName}** (${profile.position ?? "Posición N/D"}${age ? `, ${age} años` : ""}) actualmente en **${currentTeam}** (${leagueLine}). ${statsLine}. ${fitParts.join(" ")}`,
    gap: sameLeague
      ? `Encaje directo con la plantilla de ${team.league.name}`
      : `Encaje cross-league: requiere estudio de salario y adaptación al sistema ${team.league.name}`,
    recommendations: [
      {
        name: profile.fullName,
        position: profile.position ?? "N/D",
        league: getLeagueBadge(profile.league.name) as
          | "NBA"
          | "EuroLeague"
          | "ACB",
        age: age ?? 0,
        contractValue: estimateContractValue(profile),
        strengths,
        fit: fitParts.join(" "),
        market: "Evaluación personalizada",
        priority: "Candidato solicitado",
        priorityColor: "bg-brand-500/20 text-brand-300 border-brand-500/30",
      },
      ...alternativeRecs.map(alternative),
    ],
    considerations: [
      `Verifica la situación contractual actual de ${profile.fullName} con ${currentTeam}`,
      sameLeague
        ? "Al estar en la misma liga, el ajuste salarial y la compra son más predecibles"
        : "Una operación cross-league implica cláusulas de rescisión y periodos de adaptación",
      "Compara su perfil estadístico con el núcleo actual antes de iniciar negociaciones",
      "Considera el impacto en el límite salarial y en el chemistry del vestuario",
    ],
  }
}
