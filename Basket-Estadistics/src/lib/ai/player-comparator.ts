import type { ComparePlayer } from "@/lib/data/compare"

export type CategoryKey =
  | "scoring"
  | "playmaking"
  | "rebounding"
  | "defense"
  | "efficiency"
  | "availability"

export type CategoryResult = {
  key: CategoryKey
  label: string
  emoji: string
  winner: "a" | "b" | "tie" | "n/a"
  margin: number
  aValue: number | null
  bValue: number | null
  formatted: { a: string; b: string }
  summary: string
}

export type Insight = {
  kind: "strength" | "weakness" | "edge" | "context"
  player: "a" | "b" | "both"
  text: string
}

export type ComparisonOutput = {
  a: { slug: string; fullName: string; league: string }
  b: { slug: string; fullName: string; league: string }
  categories: CategoryResult[]
  overall: {
    aScore: number
    bScore: number
    leader: "a" | "b" | "tie"
    confidence: "high" | "medium" | "low"
  }
  insights: Insight[]
  verdict: string
  archetype: { a: string; b: string }
  fitNotes: string[]
  warnings: string[]
}

type Stats = NonNullable<ComparePlayer["stats"]>

function num(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null
  return v
}

function fmt1(v: number | null): string {
  return v == null ? "—" : v.toFixed(1)
}

function fmtPct(v: number | null): string {
  return v == null ? "—" : `${(v * 100).toFixed(1)}%`
}

function safeDiv(a: number | null, b: number | null): number | null {
  if (a == null || b == null || b === 0) return null
  return a / b
}

function tot(
  v: number | null | undefined,
  gp: number | null | undefined,
): number | null {
  if (v == null) return null
  return v / ((gp ?? 1) || 1)
}

function compareNumbers(
  a: number | null,
  b: number | null,
  lowerBetter = false,
): { winner: "a" | "b" | "tie" | "n/a"; margin: number } {
  if (a == null && b == null) return { winner: "n/a", margin: 0 }
  if (a == null) return { winner: "b", margin: 1 }
  if (b == null) return { winner: "a", margin: 1 }
  const delta = lowerBetter ? b - a : a - b
  const base = Math.max(Math.abs(a), Math.abs(b), 0.0001)
  const margin = Math.abs(delta) / base
  if (Math.abs(delta) < 0.01) return { winner: "tie", margin: 0 }
  return { winner: delta > 0 ? "a" : "b", margin }
}

function detectArchetype(stats: Stats | null, position: string | null): string {
  if (!stats) return position ?? "No profile"
  const gp = stats.gamesPlayed || 1
  const pts = num(tot(stats.pointsTotal, gp)) ?? 0
  const ast = num(tot(stats.assistsTotal, gp)) ?? 0
  const reb = num(tot(stats.reboundsTotal, gp)) ?? 0
  const blk = num(tot(stats.blocksTotal, gp)) ?? 0
  const stl = num(tot(stats.stealsTotal, gp)) ?? 0

  if (pts >= 24 && ast >= 6) return "Creating star"
  if (pts >= 22) return "Perimeter scorer"
  if (pts >= 20) return "Efficient finisher"
  if (ast >= 7) return "Floor general"
  if (reb >= 10 && blk >= 1.2) return "Defensive big"
  if (reb >= 9 && pts >= 14) return "Dominant interior"
  if (stl >= 1.5) return "Versatile 3&D"
  if (blk >= 1.5) return "Rim protector"
  if (pts <= 8 && ast <= 3) return "Rotation / Bench"
  return "Balanced role"
}

function categoryScoring(a: ComparePlayer, b: ComparePlayer): CategoryResult {
  const av = num(tot(a.stats?.pointsTotal, a.stats?.gamesPlayed))
  const bv = num(tot(b.stats?.pointsTotal, b.stats?.gamesPlayed))
  const cmp = compareNumbers(av, bv)
  return {
    key: "scoring",
    label: "Scoring",
    emoji: "🎯",
    winner: cmp.winner,
    margin: cmp.margin,
    aValue: av,
    bValue: bv,
    formatted: { a: `${fmt1(av)} pts`, b: `${fmt1(bv)} pts` },
    summary:
      cmp.winner === "tie" || cmp.winner === "n/a"
        ? "Very similar scoring output."
        : cmp.winner === "a"
          ? `${a.fullName} averages ${fmt1(av)} pts to ${b.fullName}'s ${fmt1(bv)}.`
          : `${b.fullName} averages ${fmt1(bv)} pts to ${a.fullName}'s ${fmt1(av)}.`,
  }
}

function categoryPlaymaking(
  a: ComparePlayer,
  b: ComparePlayer,
): CategoryResult {
  const av = num(tot(a.stats?.assistsTotal, a.stats?.gamesPlayed))
  const bv = num(tot(b.stats?.assistsTotal, b.stats?.gamesPlayed))
  const cmp = compareNumbers(av, bv)
  return {
    key: "playmaking",
    label: "Playmaking",
    emoji: "🎮",
    winner: cmp.winner,
    margin: cmp.margin,
    aValue: av,
    bValue: bv,
    formatted: { a: `${fmt1(av)} ast`, b: `${fmt1(bv)} ast` },
    summary:
      cmp.winner === "tie" || cmp.winner === "n/a"
        ? "Even assist volume."
        : cmp.winner === "a"
          ? `${a.fullName} dishes ${fmt1(av)} ast per game.`
          : `${b.fullName} dishes ${fmt1(bv)} ast per game.`,
  }
}

function categoryRebounding(
  a: ComparePlayer,
  b: ComparePlayer,
): CategoryResult {
  const av = num(tot(a.stats?.reboundsTotal, a.stats?.gamesPlayed))
  const bv = num(tot(b.stats?.reboundsTotal, b.stats?.gamesPlayed))
  const cmp = compareNumbers(av, bv)
  return {
    key: "rebounding",
    label: "Rebounding",
    emoji: "🪣",
    winner: cmp.winner,
    margin: cmp.margin,
    aValue: av,
    bValue: bv,
    formatted: { a: `${fmt1(av)} reb`, b: `${fmt1(bv)} reb` },
    summary:
      cmp.winner === "tie" || cmp.winner === "n/a"
        ? "Balanced rebounding."
        : cmp.winner === "a"
          ? `${a.fullName} controls the glass with ${fmt1(av)} per game.`
          : `${b.fullName} controls the glass with ${fmt1(bv)} per game.`,
  }
}

function categoryDefense(a: ComparePlayer, b: ComparePlayer): CategoryResult {
  const aStl = num(tot(a.stats?.stealsTotal, a.stats?.gamesPlayed)) ?? 0
  const aBlk = num(tot(a.stats?.blocksTotal, a.stats?.gamesPlayed)) ?? 0
  const bStl = num(tot(b.stats?.stealsTotal, b.stats?.gamesPlayed)) ?? 0
  const bBlk = num(tot(b.stats?.blocksTotal, b.stats?.gamesPlayed)) ?? 0
  const av = aStl + aBlk
  const bv = bStl + bBlk
  const av2 = Number.isFinite(av) && av > 0 ? av : null
  const bv2 = Number.isFinite(bv) && bv > 0 ? bv : null
  const cmp = compareNumbers(av2, bv2)
  return {
    key: "defense",
    label: "Defensive impact",
    emoji: "🛡️",
    winner: cmp.winner,
    margin: cmp.margin,
    aValue: av2,
    bValue: bv2,
    formatted: {
      a: `${fmt1(aStl)} stl · ${fmt1(aBlk)} blk`,
      b: `${fmt1(bStl)} stl · ${fmt1(bBlk)} blk`,
    },
    summary:
      cmp.winner === "tie" || cmp.winner === "n/a"
        ? "Similar defensive output in steals and blocks."
        : cmp.winner === "a"
          ? `${a.fullName} adds ${(av2 ?? 0).toFixed(1)} defensive plays per game.`
          : `${b.fullName} adds ${(bv2 ?? 0).toFixed(1)} defensive plays per game.`,
  }
}

function categoryEfficiency(
  a: ComparePlayer,
  b: ComparePlayer,
): CategoryResult {
  const aFg = null
  const aTp = null
  const aFt = null
  const bFg = null
  const bTp = null
  const bFt = null
  const aAvg = avg([aFg, aTp, aFt])
  const bAvg = avg([bFg, bTp, bFt])
  const cmp = compareNumbers(aAvg, bAvg)
  return {
    key: "efficiency",
    label: "Shooting efficiency",
    emoji: "📈",
    winner: cmp.winner,
    margin: cmp.margin,
    aValue: aAvg,
    bValue: bAvg,
    formatted: {
      a: `${fmtPct(aFg)} / ${fmtPct(aTp)} / ${fmtPct(aFt)}`,
      b: `${fmtPct(bFg)} / ${fmtPct(bTp)} / ${fmtPct(bFt)}`,
    },
    summary:
      cmp.winner === "tie" || cmp.winner === "n/a"
        ? "Shooting splits at a similar level."
        : cmp.winner === "a"
          ? `${a.fullName} is more efficient across FG%/3P%/FT%.`
          : `${b.fullName} is more efficient across FG%/3P%/FT%.`,
  }
}

function categoryAvailability(
  a: ComparePlayer,
  b: ComparePlayer,
): CategoryResult {
  const aGp = num(a.stats?.gamesPlayed ?? null)
  const bGp = num(b.stats?.gamesPlayed ?? null)
  const cmp = compareNumbers(aGp, bGp)
  return {
    key: "availability",
    label: "Games played",
    emoji: "⏱️",
    winner: cmp.winner,
    margin: cmp.margin,
    aValue: aGp,
    bValue: bGp,
    formatted: {
      a: `${aGp ?? "—"} GP`,
      b: `${bGp ?? "—"} GP`,
    },
    summary:
      cmp.winner === "tie" || cmp.winner === "n/a"
        ? "Comparable games played."
        : cmp.winner === "a"
          ? `${a.fullName} has played ${aGp} games this season.`
          : `${b.fullName} has played ${bGp} games this season.`,
  }
}

function avg(values: Array<number | null>): number | null {
  const valid = values.filter((v): v is number => v != null)
  if (valid.length === 0) return null
  return valid.reduce((acc, v) => acc + v, 0) / valid.length
}

function buildInsights(
  a: ComparePlayer,
  b: ComparePlayer,
  cats: CategoryResult[],
): Insight[] {
  const insights: Insight[] = []
  const aWins = cats.filter((c) => c.winner === "a")
  const bWins = cats.filter((c) => c.winner === "b")

  const biggestAEdge = [...aWins].sort((x, y) => y.margin - x.margin)[0]
  const biggestBEdge = [...bWins].sort((x, y) => y.margin - x.margin)[0]

  if (biggestAEdge) {
    insights.push({
      kind: "edge",
      player: "a",
      text: `Clear edge in ${biggestAEdge.label.toLowerCase()} (+${Math.round(biggestAEdge.margin * 100)}% over ${b.fullName}).`,
    })
  }
  if (biggestBEdge) {
    insights.push({
      kind: "edge",
      player: "b",
      text: `Clear edge in ${biggestBEdge.label.toLowerCase()} (+${Math.round(biggestBEdge.margin * 100)}% over ${a.fullName}).`,
    })
  }

  const aTo = num(tot(a.stats?.turnoversTotal, a.stats?.gamesPlayed))
  const bTo = num(tot(b.stats?.turnoversTotal, b.stats?.gamesPlayed))
  if (aTo != null && bTo != null) {
    if (aTo > bTo + 0.6) {
      insights.push({
        kind: "weakness",
        player: "a",
        text: `Turns it over more than ${b.fullName} (${aTo.toFixed(1)} vs ${bTo.toFixed(1)} per game).`,
      })
    } else if (bTo > aTo + 0.6) {
      insights.push({
        kind: "weakness",
        player: "b",
        text: `Turns it over more than ${a.fullName} (${bTo.toFixed(1)} vs ${aTo.toFixed(1)} per game).`,
      })
    }
  }

  const aAst = num(tot(a.stats?.assistsTotal, a.stats?.gamesPlayed))
  const bAst = num(tot(b.stats?.assistsTotal, b.stats?.gamesPlayed))
  const aAstTo = safeDiv(aAst, aTo)
  const bAstTo = safeDiv(bAst, bTo)
  if (aAstTo != null && bAstTo != null) {
    if (aAstTo >= 2.5) {
      insights.push({
        kind: "strength",
        player: "a",
        text: `AST/TO ratio ${aAstTo.toFixed(2)} — very secure decision-maker.`,
      })
    }
    if (bAstTo >= 2.5) {
      insights.push({
        kind: "strength",
        player: "b",
        text: `AST/TO ratio ${bAstTo.toFixed(2)} — very secure decision-maker.`,
      })
    }
  }

  if (a.league.slug !== b.league.slug) {
    insights.push({
      kind: "context",
      player: "both",
      text: `They play in different leagues (${a.league.name} vs ${b.league.name}). Pace and competition level vary — read the numbers through that lens.`,
    })
  }

  return insights.slice(0, 6)
}

function buildVerdict(
  a: ComparePlayer,
  b: ComparePlayer,
  cats: CategoryResult[],
  aScore: number,
  bScore: number,
): string {
  const diff = Math.abs(aScore - bScore)
  if (diff < 0.5) {
    return `${a.fullName} and ${b.fullName} are essentially level: ${aScore.toFixed(1)} vs ${bScore.toFixed(1)} out of 6. The pick comes down to role and tactical fit.`
  }
  const leader = aScore > bScore ? a : b
  const trailing = aScore > bScore ? b : a
  const dominant = cats
    .filter((c) => (aScore > bScore ? c.winner === "a" : c.winner === "b"))
    .slice(0, 2)
    .map((c) => c.label.toLowerCase())
    .join(" and ")
  return `${leader.fullName} comes out ahead overall (${Math.max(aScore, bScore).toFixed(1)} vs ${Math.min(aScore, bScore).toFixed(1)}), driven mainly by ${dominant || "several areas"}. ${trailing.fullName} keeps value in complementary roles.`
}

function buildFitNotes(a: ComparePlayer, b: ComparePlayer): string[] {
  const notes: string[] = []
  const aArch = detectArchetype(a.stats, a.position)
  const bArch = detectArchetype(b.stats, b.position)

  if (aArch.includes("scorer") && bArch.includes("general")) {
    notes.push(
      `Natural offensive pairing: ${a.fullName} creates their own shot while ${b.fullName} runs the offense.`,
    )
  } else if (bArch.includes("scorer") && aArch.includes("general")) {
    notes.push(
      `Natural offensive pairing: ${b.fullName} creates their own shot while ${a.fullName} runs the offense.`,
    )
  }

  if (aArch.includes("Defensive") || bArch.includes("Defensive")) {
    notes.push(
      "At least one brings a clear defensive profile — useful for closing games on that end.",
    )
  }

  if (aArch.includes("Shooting") && bArch.includes("Shooting")) {
    notes.push(
      "Both stretch the floor: very spaced lineups but less interior creation.",
    )
  }

  if (a.position && b.position && a.position[0] === b.position[0]) {
    notes.push(
      `They share a primary position (${a.position}/${b.position}). Playing them together needs a two-guard or versatile-forward system.`,
    )
  }

  if (notes.length === 0) {
    notes.push(
      "Complementary profiles across many areas — easy to pair in a rotation.",
    )
  }
  return notes
}

function buildWarnings(a: ComparePlayer, b: ComparePlayer): string[] {
  const warnings: string[] = []
  if (!a.stats)
    warnings.push(
      `No season stats for ${a.fullName}; the analysis leans on partial data.`,
    )
  if (!b.stats)
    warnings.push(
      `No season stats for ${b.fullName}; the analysis leans on partial data.`,
    )
  if (a.league.slug !== b.league.slug) {
    warnings.push(
      "Comparing across leagues doesn't normalize pace or defensive level. Treat the rankings as indicative.",
    )
  }
  const aGp = num(a.stats?.gamesPlayed ?? null) ?? 0
  const bGp = num(b.stats?.gamesPlayed ?? null) ?? 0
  if (aGp > 0 && aGp < 15)
    warnings.push(`Small sample for ${a.fullName} (${aGp} GP).`)
  if (bGp > 0 && bGp < 15)
    warnings.push(`Small sample for ${b.fullName} (${bGp} GP).`)
  return warnings
}

export function comparePlayers(
  a: ComparePlayer,
  b: ComparePlayer,
): ComparisonOutput {
  const categories: CategoryResult[] = [
    categoryScoring(a, b),
    categoryPlaymaking(a, b),
    categoryRebounding(a, b),
    categoryDefense(a, b),
    categoryEfficiency(a, b),
    categoryAvailability(a, b),
  ]

  let aScore = 0
  let bScore = 0
  let valid = 0
  for (const c of categories) {
    if (c.winner === "a") {
      aScore += 1
      valid += 1
    } else if (c.winner === "b") {
      bScore += 1
      valid += 1
    } else if (c.winner === "tie") {
      aScore += 0.5
      bScore += 0.5
      valid += 1
    }
  }

  const confidence: "high" | "medium" | "low" =
    valid >= 5 ? "high" : valid >= 3 ? "medium" : "low"

  const insights = buildInsights(a, b, categories)
  const verdict = buildVerdict(a, b, categories, aScore, bScore)

  return {
    a: { slug: a.slug, fullName: a.fullName, league: a.league.name },
    b: { slug: b.slug, fullName: b.fullName, league: b.league.name },
    categories,
    overall: {
      aScore,
      bScore,
      leader: aScore > bScore ? "a" : bScore > aScore ? "b" : "tie",
      confidence,
    },
    insights,
    verdict,
    archetype: {
      a: detectArchetype(a.stats, a.position),
      b: detectArchetype(b.stats, b.position),
    },
    fitNotes: buildFitNotes(a, b),
    warnings: buildWarnings(a, b),
  }
}
