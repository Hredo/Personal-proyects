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
    confidence: "alta" | "media" | "baja"
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
  if (!stats) return position ?? "Sin perfil"
  const pts = num(stats.points) ?? 0
  const ast = num(stats.assists) ?? 0
  const reb = num(stats.rebounds) ?? 0
  const blk = num(stats.blocks) ?? 0
  const stl = num(stats.steals) ?? 0
  const tp = num(stats.threePct) ?? 0
  const fg = num(stats.fgPct) ?? 0

  if (pts >= 24 && ast >= 6) return "Estrella generadora"
  if (pts >= 22 && tp >= 0.38) return "Anotador exterior"
  if (pts >= 20 && fg >= 0.5) return "Finalizador eficiente"
  if (ast >= 7) return "Base director"
  if (reb >= 10 && blk >= 1.2) return "Pívot defensivo"
  if (reb >= 9 && pts >= 14) return "Interior dominante"
  if (stl >= 1.5 && tp >= 0.36) return "3&D versátil"
  if (blk >= 1.5) return "Protector de aro"
  if (tp >= 0.4) return "Especialista tirador"
  if (pts <= 8 && ast <= 3) return "Rotación / Suplente"
  return "Rol equilibrado"
}

function categoryScoring(a: ComparePlayer, b: ComparePlayer): CategoryResult {
  const av = num(a.stats?.points ?? null)
  const bv = num(b.stats?.points ?? null)
  const cmp = compareNumbers(av, bv)
  return {
    key: "scoring",
    label: "Anotación",
    emoji: "🎯",
    winner: cmp.winner,
    margin: cmp.margin,
    aValue: av,
    bValue: bv,
    formatted: { a: `${fmt1(av)} pts`, b: `${fmt1(bv)} pts` },
    summary:
      cmp.winner === "tie" || cmp.winner === "n/a"
        ? "Producción anotadora muy similar."
        : cmp.winner === "a"
          ? `${a.fullName} promedia ${fmt1(av)} pts frente a ${fmt1(bv)} de ${b.fullName}.`
          : `${b.fullName} promedia ${fmt1(bv)} pts frente a ${fmt1(av)} de ${a.fullName}.`,
  }
}

function categoryPlaymaking(
  a: ComparePlayer,
  b: ComparePlayer,
): CategoryResult {
  const av = num(a.stats?.assists ?? null)
  const bv = num(b.stats?.assists ?? null)
  const cmp = compareNumbers(av, bv)
  return {
    key: "playmaking",
    label: "Generación",
    emoji: "🎮",
    winner: cmp.winner,
    margin: cmp.margin,
    aValue: av,
    bValue: bv,
    formatted: { a: `${fmt1(av)} ast`, b: `${fmt1(bv)} ast` },
    summary:
      cmp.winner === "tie" || cmp.winner === "n/a"
        ? "Volumen de asistencias parejo."
        : cmp.winner === "a"
          ? `${a.fullName} reparte ${fmt1(av)} ast por partido.`
          : `${b.fullName} reparte ${fmt1(bv)} ast por partido.`,
  }
}

function categoryRebounding(
  a: ComparePlayer,
  b: ComparePlayer,
): CategoryResult {
  const av = num(a.stats?.rebounds ?? null)
  const bv = num(b.stats?.rebounds ?? null)
  const cmp = compareNumbers(av, bv)
  return {
    key: "rebounding",
    label: "Rebote",
    emoji: "🪣",
    winner: cmp.winner,
    margin: cmp.margin,
    aValue: av,
    bValue: bv,
    formatted: { a: `${fmt1(av)} reb`, b: `${fmt1(bv)} reb` },
    summary:
      cmp.winner === "tie" || cmp.winner === "n/a"
        ? "Captura de balones equilibrada."
        : cmp.winner === "a"
          ? `${a.fullName} domina el rebote con ${fmt1(av)} por partido.`
          : `${b.fullName} domina el rebote con ${fmt1(bv)} por partido.`,
  }
}

function categoryDefense(a: ComparePlayer, b: ComparePlayer): CategoryResult {
  const aStl = num(a.stats?.steals ?? null) ?? 0
  const aBlk = num(a.stats?.blocks ?? null) ?? 0
  const bStl = num(b.stats?.steals ?? null) ?? 0
  const bBlk = num(b.stats?.blocks ?? null) ?? 0
  const av = aStl + aBlk
  const bv = bStl + bBlk
  const av2 = Number.isFinite(av) && av > 0 ? av : null
  const bv2 = Number.isFinite(bv) && bv > 0 ? bv : null
  const cmp = compareNumbers(av2, bv2)
  return {
    key: "defense",
    label: "Impacto defensivo",
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
        ? "Aportación defensiva similar en robos y tapones."
        : cmp.winner === "a"
          ? `${a.fullName} suma ${(av2 ?? 0).toFixed(1)} acciones defensivas/partido.`
          : `${b.fullName} suma ${(bv2 ?? 0).toFixed(1)} acciones defensivas/partido.`,
  }
}

function categoryEfficiency(
  a: ComparePlayer,
  b: ComparePlayer,
): CategoryResult {
  const aFg = num(a.stats?.fgPct ?? null)
  const aTp = num(a.stats?.threePct ?? null)
  const aFt = num(a.stats?.ftPct ?? null)
  const bFg = num(b.stats?.fgPct ?? null)
  const bTp = num(b.stats?.threePct ?? null)
  const bFt = num(b.stats?.ftPct ?? null)
  const aAvg = avg([aFg, aTp, aFt])
  const bAvg = avg([bFg, bTp, bFt])
  const cmp = compareNumbers(aAvg, bAvg)
  return {
    key: "efficiency",
    label: "Eficiencia de tiro",
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
        ? "Splits de tiro a un nivel parecido."
        : cmp.winner === "a"
          ? `${a.fullName} es más eficiente combinando FG%/3P%/FT%.`
          : `${b.fullName} es más eficiente combinando FG%/3P%/FT%.`,
  }
}

function categoryAvailability(
  a: ComparePlayer,
  b: ComparePlayer,
): CategoryResult {
  const aMin = num(a.stats?.minutesPerGame ?? null)
  const bMin = num(b.stats?.minutesPerGame ?? null)
  const aGp = num(a.stats?.gamesPlayed ?? null)
  const bGp = num(b.stats?.gamesPlayed ?? null)
  const aLoad = aMin != null && aGp != null ? aMin * aGp : (aMin ?? aGp)
  const bLoad = bMin != null && bGp != null ? bMin * bGp : (bMin ?? bGp)
  const cmp = compareNumbers(aLoad, bLoad)
  return {
    key: "availability",
    label: "Carga / Minutaje",
    emoji: "⏱️",
    winner: cmp.winner,
    margin: cmp.margin,
    aValue: aLoad,
    bValue: bLoad,
    formatted: {
      a: `${fmt1(aMin)} min · ${aGp ?? "—"} GP`,
      b: `${fmt1(bMin)} min · ${bGp ?? "—"} GP`,
    },
    summary:
      cmp.winner === "tie" || cmp.winner === "n/a"
        ? "Carga de trabajo equivalente."
        : cmp.winner === "a"
          ? `${a.fullName} asume más minutos totales en la temporada.`
          : `${b.fullName} asume más minutos totales en la temporada.`,
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
      text: `Ventaja clara en ${biggestAEdge.label.toLowerCase()} (+${Math.round(biggestAEdge.margin * 100)}% sobre ${b.fullName}).`,
    })
  }
  if (biggestBEdge) {
    insights.push({
      kind: "edge",
      player: "b",
      text: `Ventaja clara en ${biggestBEdge.label.toLowerCase()} (+${Math.round(biggestBEdge.margin * 100)}% sobre ${a.fullName}).`,
    })
  }

  const aTo = num(a.stats?.turnovers ?? null)
  const bTo = num(b.stats?.turnovers ?? null)
  if (aTo != null && bTo != null) {
    if (aTo > bTo + 0.6) {
      insights.push({
        kind: "weakness",
        player: "a",
        text: `Pierde más balones que ${b.fullName} (${aTo.toFixed(1)} vs ${bTo.toFixed(1)} pp).`,
      })
    } else if (bTo > aTo + 0.6) {
      insights.push({
        kind: "weakness",
        player: "b",
        text: `Pierde más balones que ${a.fullName} (${bTo.toFixed(1)} vs ${aTo.toFixed(1)} pp).`,
      })
    }
  }

  const aAst = num(a.stats?.assists ?? null)
  const bAst = num(b.stats?.assists ?? null)
  const aAstTo = safeDiv(aAst, aTo)
  const bAstTo = safeDiv(bAst, bTo)
  if (aAstTo != null && bAstTo != null) {
    if (aAstTo >= 2.5) {
      insights.push({
        kind: "strength",
        player: "a",
        text: `Ratio AST/TO ${aAstTo.toFixed(2)} — toma decisiones muy seguras.`,
      })
    }
    if (bAstTo >= 2.5) {
      insights.push({
        kind: "strength",
        player: "b",
        text: `Ratio AST/TO ${bAstTo.toFixed(2)} — toma decisiones muy seguras.`,
      })
    }
  }

  const aTp = num(a.stats?.threePct ?? null)
  const bTp = num(b.stats?.threePct ?? null)
  if (aTp != null && aTp >= 0.4) {
    insights.push({
      kind: "strength",
      player: "a",
      text: `Tirador élite desde el perímetro (${(aTp * 100).toFixed(1)}% en triples).`,
    })
  }
  if (bTp != null && bTp >= 0.4) {
    insights.push({
      kind: "strength",
      player: "b",
      text: `Tirador élite desde el perímetro (${(bTp * 100).toFixed(1)}% en triples).`,
    })
  }

  if (a.league.slug !== b.league.slug) {
    insights.push({
      kind: "context",
      player: "both",
      text: `Juegan en ligas distintas (${a.league.name} vs ${b.league.name}). Pace y nivel competitivo varían — interpreta las cifras con esa lente.`,
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
    return `${a.fullName} y ${b.fullName} están prácticamente al mismo nivel: ${aScore.toFixed(1)} vs ${bScore.toFixed(1)} sobre 6. La elección depende del rol y del encaje táctico.`
  }
  const leader = aScore > bScore ? a : b
  const trailing = aScore > bScore ? b : a
  const dominant = cats
    .filter((c) => (aScore > bScore ? c.winner === "a" : c.winner === "b"))
    .slice(0, 2)
    .map((c) => c.label.toLowerCase())
    .join(" y ")
  return `${leader.fullName} se impone globalmente (${Math.max(aScore, bScore).toFixed(1)} vs ${Math.min(aScore, bScore).toFixed(1)}), apoyado sobre todo en ${dominant || "varias áreas"}. ${trailing.fullName} mantiene su valor en perfiles complementarios.`
}

function buildFitNotes(a: ComparePlayer, b: ComparePlayer): string[] {
  const notes: string[] = []
  const aArch = detectArchetype(a.stats, a.position)
  const bArch = detectArchetype(b.stats, b.position)

  if (aArch.includes("Anotador") && bArch.includes("director")) {
    notes.push(
      `Combo ofensivo natural: ${a.fullName} crea su tiro y ${b.fullName} le organiza el juego.`,
    )
  } else if (bArch.includes("Anotador") && aArch.includes("director")) {
    notes.push(
      `Combo ofensivo natural: ${b.fullName} crea su tiro y ${a.fullName} le organiza el juego.`,
    )
  }

  if (aArch.includes("defensivo") || bArch.includes("defensivo")) {
    notes.push(
      "Al menos uno aporta un perfil defensivo claro — útil para cerrar partidos en defensa.",
    )
  }

  if (aArch.includes("tirador") && bArch.includes("tirador")) {
    notes.push(
      "Ambos abren el campo desde el perímetro: alineaciones muy espaciadas pero con menos creación interior.",
    )
  }

  if (a.position && b.position && a.position[0] === b.position[0]) {
    notes.push(
      `Comparten posición base (${a.position}/${b.position}). Si juegan juntos, exige un sistema con dobles bases o ala-pívots versátiles.`,
    )
  }

  if (notes.length === 0) {
    notes.push(
      "Perfiles complementarios en muchas áreas — fácil de combinar en rotación.",
    )
  }
  return notes
}

function buildWarnings(a: ComparePlayer, b: ComparePlayer): string[] {
  const warnings: string[] = []
  if (!a.stats)
    warnings.push(
      `No hay stats de temporada para ${a.fullName}; el análisis se apoya en datos parciales.`,
    )
  if (!b.stats)
    warnings.push(
      `No hay stats de temporada para ${b.fullName}; el análisis se apoya en datos parciales.`,
    )
  if (a.league.slug !== b.league.slug) {
    warnings.push(
      "Comparar entre ligas distintas no normaliza pace ni nivel defensivo. Toma los rankings como orientativos.",
    )
  }
  const aGp = num(a.stats?.gamesPlayed ?? null) ?? 0
  const bGp = num(b.stats?.gamesPlayed ?? null) ?? 0
  if (aGp > 0 && aGp < 15)
    warnings.push(`Muestra pequeña para ${a.fullName} (${aGp} GP).`)
  if (bGp > 0 && bGp < 15)
    warnings.push(`Muestra pequeña para ${b.fullName} (${bGp} GP).`)
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

  const confidence: "alta" | "media" | "baja" =
    valid >= 5 ? "alta" : valid >= 3 ? "media" : "baja"

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
