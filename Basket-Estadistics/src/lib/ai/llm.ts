import type { TeamProfile } from "@/lib/data/teams"
import type { PlayerProfile } from "@/lib/data/players"
import { formatStat, getLeagueBadge } from "@/lib/ai/local-advisor"
import { chatComplete, type ChatMessage } from "@/lib/ai/chat"
import type { AiProvider } from "@/lib/ai/providers"

export type AdvisorHistoryMessage = {
  role: "user" | "assistant"
  content: string
}

/** The engine to drive a single advisor response, resolved per user/request. */
export type AdvisorEngine = {
  provider: AiProvider
  model: string
  apiKey: string | null
}

export type GenerateAdvisorInput = {
  team: TeamProfile
  userMessage: string
  history: AdvisorHistoryMessage[]
  playerProfile?: PlayerProfile | null
}

let lastError: string | null = null

export function lastLlmError(): string | null {
  return lastError
}

function setError(msg: string): void {
  lastError = msg
  console.error(`[llm] ${msg}`)
}

function buildPlayerContext(profile: PlayerProfile): string {
  const latest = profile.seasons[0]

  const lines: string[] = []
  lines.push(`# Jugador mencionado en la consulta`)
  lines.push(`- Nombre: ${profile.fullName}`)
  lines.push(`- Slug: ${profile.slug}`)
  lines.push(`- Liga: ${profile.league.name} (${profile.league.region})`)
  if (profile.team) {
    lines.push(`- Equipo actual: ${profile.team.name}`)
  } else {
    lines.push(`- Equipo actual: agente libre / sin equipo registrado`)
  }
  if (profile.position) lines.push(`- Posición: ${profile.position}`)
  if (profile.nationality) lines.push(`- Nacionalidad: ${profile.nationality}`)
  if (profile.heightCm)
    lines.push(`- Altura: ${(profile.heightCm / 100).toFixed(2)} m`)

  if (latest) {
    const gp = latest.gamesPlayed || 1
    lines.push("")
    lines.push(`Última temporada registrada (${latest.seasonName}):`)
    if (latest.gamesPlayed !== null)
      lines.push(`- Partidos: ${latest.gamesPlayed}`)
    if (latest.pointsTotal !== null)
      lines.push(`- Puntos: ${formatStat(latest.pointsTotal / gp)} PPG`)
    if (latest.reboundsTotal !== null)
      lines.push(`- Rebotes: ${formatStat(latest.reboundsTotal / gp)} RPG`)
    if (latest.assistsTotal !== null)
      lines.push(`- Asistencias: ${formatStat(latest.assistsTotal / gp)} APG`)
    if (latest.stealsTotal !== null)
      lines.push(`- Robos: ${formatStat(latest.stealsTotal / gp)} SPG`)
    if (latest.blocksTotal !== null)
      lines.push(`- Tapones: ${formatStat(latest.blocksTotal / gp)} BPG`)
  } else {
    lines.push("")
    lines.push(`Sin estadísticas de temporada registradas en la base de datos.`)
  }

  lines.push("")
  lines.push(
    `IMPORTANTE: estos datos son los únicos verificables. No inventes otros contratos, premios o temporadas. Si la consulta requiere información adicional (salario exacto, lesiones, etc.) indícalo claramente.`,
  )

  return lines.join("\n")
}

function buildTeamContext(team: TeamProfile): string {
  const lines: string[] = []
  lines.push(`# Equipo del usuario`)
  lines.push(`- Nombre: ${team.name}`)
  lines.push(`- Liga: ${team.league.name} (${team.league.region})`)
  lines.push(`- Plantilla: ${team.roster.length} jugadores`)

  const positions = team.roster.reduce<Record<string, number>>((acc, p) => {
    const pos = (p.position || "?").toUpperCase().charAt(0)
    acc[pos] = (acc[pos] ?? 0) + 1
    return acc
  }, {})
  const posLine = Object.entries(positions)
    .map(([k, v]) => `${k}:${v}`)
    .join(" · ")
  if (posLine) lines.push(`- Distribución de posiciones: ${posLine}`)

  if (team.roster.length > 0) {
    const names = team.roster
      .slice(0, 12)
      .map((p) => `${p.fullName}${p.position ? ` (${p.position})` : ""}`)
      .join(", ")
    lines.push(
      `- Núcleo principal: ${names}${team.roster.length > 12 ? ` y ${team.roster.length - 12} más` : ""}`,
    )
  }
  return lines.join("\n")
}

function buildSystemPrompt(input: GenerateAdvisorInput): string {
  const leagueBadge = getLeagueBadge(input.team.league.name)
  const teamCtx = buildTeamContext(input.team)
  const playerCtx = input.playerProfile
    ? "\n\n" + buildPlayerContext(input.playerProfile)
    : ""

  return [
    `Eres Basket Scout AI, un asesor experto en fichajes de baloncesto con conocimiento profundo de la NBA, la EuroLeague y la Liga ACB (España). Tu objetivo es ayudar al usuario a tomar decisiones informadas sobre incorporaciones para su equipo.`,
    ``,
    `## Reglas de comportamiento`,
    `- Detecta el idioma del mensaje del usuario y responde SIEMPRE en ese mismo idioma. Por ejemplo: si el usuario escribe en español, responde en español; si escribe en inglés, responde en inglés; si escribe en francés, responde en francés.`,
    `- Mantén el tono profesional pero cercano.`,
    `- Basa tus respuestas en los datos proporcionados en el contexto. No inventes contratos, premios, lesiones ni estadísticas que no aparezcan explícitamente. Si no tienes un dato, dilo.`,
    `- Sé conciso (150-300 palabras). Cero relleno. Nada de "Aquí te presento...", "Cada uno de estos jugadores...", "En conclusión...". Ve al grano.`,
    `- Si la consulta hace referencia a un jugador concreto, céntrate en su perfil, encaje con el equipo y pros/contras.`,
    `- Si la consulta es genérica (recomiéndame un base, busca un anotador...), propón 2-3 alternativas razonables.`,
    `- Si la consulta es de seguimiento ("por qué X?", "y si en lugar de eso...?"), responde directamente sin repetir lo anterior.`,
    ``,
    `## Formato OBLIGATORIO de respuesta`,
    `Usa SIEMPRE esta estructura. Es estricta, no la improvises:`,
    ``,
    `### Para recomendaciones de jugadores:`,
    "",
    `## Resumen rápido`,
    `1 frase directa con la conclusión principal.`,
    ``,
    `## Perfiles recomendados`,
    ``,
    `### 1. Nombre Completo — Posición (Liga, Equipo)`,
    `- **Por qué encaja**: 1 frase concreta.`,
    `- **Puntos fuertes**: 2-3 keywords separadas por coma.`,
    `- **A tener en cuenta**: 1 frase de riesgo o condición.`,
    `- **Coste estimado**: rango o etiqueta.`,
    ``,
    `(repite el bloque ### N. para cada jugador, hasta 3)`,
    ``,
    `## Antes de negociar`,
    `- 2-3 bullets con consideraciones prácticas (espacio salarial, cláusula, plazos).`,
    "",
    ``,
    `### Para análisis de un jugador concreto:`,
    "",
    `## Ficha`,
    `1-2 frases con el perfil y momento actual del jugador.`,
    ``,
    `## Estadísticas`,
    `| Partidos | Min | Puntos | Rebotes | Asistencias | Robos | Tapones | TC | 3P | TL |`,
    `|---|---|---|---|---|---|---|---|---|---|`,
    `| valor | valor | valor | ... | ... | ... | ... | ... | ... | ... |`,
    ``,
    `## Encaje con el equipo`,
    `- 2-3 bullets sobre pros y contras de la operación.`,
    ``,
    `## Veredicto`,
    `1 frase final con la recomendación.`,
    "",
    ``,
    `### Para preguntas de seguimiento:`,
    `Responde en 2-4 frases máximo, sin sección "Resumen". Empieza con la respuesta directa.`,
    ``,
    `## Reglas de formato Markdown`,
    `- Encabezados: usa ## para secciones principales, ### para sub-secciones.`,
    `- **Negrita** SOLO para nombres de jugadores y etiquetas de campos (Por qué encaja, Puntos fuertes, etc.).`,
    `- Listas SIEMPRE con guión y espacio ("- texto").`,
    `- Tablas SIEMPRE con la primera fila como cabecera separada por | y la fila separadora vacía debajo.`,
    `- Emojis: máximo 1 al inicio de cada sección principal (🏀, 📊, 🎯, 🛡️, 💡).`,
    `- NUNCA uses tablas de comparación con más de 3 columnas. Para comparaciones, usa listas.`,
    ``,
    `## Contexto del equipo del usuario`,
    teamCtx,
    ``,
    `Ten en cuenta que el equipo juega en la ${leagueBadge} y sus fichajes deben encajar con el sistema, el límite salarial y la química de vestuario de esa liga.${playerCtx}`,
  ].join("\n")
}

export async function generateAdvisorResponse(
  input: GenerateAdvisorInput,
  engine: AdvisorEngine,
): Promise<{ content: string; model: string } | null> {
  const messages: ChatMessage[] = [
    ...input.history.slice(-8),
    { role: "user", content: input.userMessage },
  ]

  const result = await chatComplete({
    provider: engine.provider,
    model: engine.model,
    apiKey: engine.apiKey,
    system: buildSystemPrompt(input),
    messages,
    maxTokens: 700,
    temperature: 0.6,
  })

  if (!result.ok) {
    setError(result.error)
    return null
  }
  lastError = null
  return { content: result.content, model: result.model }
}
