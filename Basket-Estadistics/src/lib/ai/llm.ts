import type { TeamProfile } from "@/lib/data/teams"
import type { PlayerProfile } from "@/lib/data/players"
import { formatStat, getLeagueBadge } from "@/lib/ai/local-advisor"
import { safeOllamaBaseUrl } from "@/lib/security/ai-advisor"

const DEFAULT_MODEL = "llama3.1:8b"
const DEFAULT_BASE_URL = "http://localhost:11434/v1"
const LLM_TIMEOUT_MS = 120_000

export type AdvisorHistoryMessage = {
  role: "user" | "assistant"
  content: string
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

export function isLlmEnabled(): boolean {
  // Ollama runs locally with no API key. We just check it's reachable.
  return true
}

function buildPlayerContext(profile: PlayerProfile): string {
  const latest = profile.seasons[0]
  const age = profile.birthdate
    ? Math.floor(
        (Date.now() - new Date(profile.birthdate).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null

  const lines: string[] = []
  lines.push(`# Jugador mencionado en la consulta`)
  lines.push(`- Nombre: ${profile.fullName}`)
  lines.push(`- Slug: ${profile.slug}`)
  lines.push(`- Liga: ${profile.league.name} (${profile.league.country})`)
  if (profile.team) {
    lines.push(`- Equipo actual: ${profile.team.name}`)
  } else {
    lines.push(`- Equipo actual: agente libre / sin equipo registrado`)
  }
  if (profile.position) lines.push(`- Posición: ${profile.position}`)
  if (profile.nationality) lines.push(`- Nacionalidad: ${profile.nationality}`)
  if (age !== null) lines.push(`- Edad: ${age} años`)
  if (profile.heightCm)
    lines.push(`- Altura: ${(profile.heightCm / 100).toFixed(2)} m`)

  if (latest) {
    const fmtPct = (v: number | null | undefined): string => {
      if (v === null || v === undefined) return "—"
      const asPercent = v <= 1 ? v * 100 : v
      return `${asPercent.toFixed(1)}%`
    }
    lines.push("")
    lines.push(`Última temporada registrada (${latest.year}):`)
    if (latest.gamesPlayed !== null)
      lines.push(`- Partidos: ${latest.gamesPlayed}`)
    if (latest.minutesPerGame !== null)
      lines.push(`- Minutos por partido: ${formatStat(latest.minutesPerGame)}`)
    if (latest.points !== null)
      lines.push(`- Puntos: ${formatStat(latest.points)} PPG`)
    if (latest.rebounds !== null)
      lines.push(`- Rebotes: ${formatStat(latest.rebounds)} RPG`)
    if (latest.assists !== null)
      lines.push(`- Asistencias: ${formatStat(latest.assists)} APG`)
    if (latest.steals !== null)
      lines.push(`- Robos: ${formatStat(latest.steals)} SPG`)
    if (latest.blocks !== null)
      lines.push(`- Tapones: ${formatStat(latest.blocks)} BPG`)
    if (latest.turnovers !== null)
      lines.push(`- Pérdidas: ${formatStat(latest.turnovers)} TOPG`)
    if (latest.fgPct !== null) lines.push(`- TC: ${fmtPct(latest.fgPct)}`)
    if (latest.threePct !== null) lines.push(`- 3P: ${fmtPct(latest.threePct)}`)
    if (latest.ftPct !== null) lines.push(`- TL: ${fmtPct(latest.ftPct)}`)
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
  lines.push(`- Liga: ${team.league.name} (${team.league.country})`)
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
): Promise<{ content: string; model: string } | null> {
  const rawBase = process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL
  const safeBase = safeOllamaBaseUrl(rawBase)
  if (!safeBase) {
    setError(
      `OLLAMA_BASE_URL no es seguro (${rawBase}). Solo se permiten direcciones loopback o redes privadas.`,
    )
    return null
  }
  const baseUrl = safeBase
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_MODEL
  const url = `${baseUrl}/chat/completions`

  const messages: AdvisorHistoryMessage[] = [
    ...input.history.slice(-8),
    { role: "user", content: input.userMessage },
  ]

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(input) },
          ...messages,
        ],
        max_tokens: 700,
        temperature: 0.6,
        top_p: 0.9,
        stream: false,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      const snippet = detail.slice(0, 300)
      if (res.status === 404) {
        setError(
          `Ollama no encuentra el modelo "${model}". Ejecuta: ollama pull ${model}`,
        )
      } else {
        setError(`Ollama ${res.status} ${res.statusText}: ${snippet}`)
      }
      return null
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content?.trim()
    if (!content) {
      setError("Ollama devolvió una respuesta vacía")
      return null
    }
    lastError = null
    return { content, model }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      setError(
        `Ollama tardó demasiado (>${LLM_TIMEOUT_MS / 1000}s). Si el modelo es grande o el equipo tiene poca RAM, prueba con uno más pequeño (e.g. llama3.2:3b).`,
      )
    } else if (err instanceof Error) {
      const code = (err as NodeJS.ErrnoException).code
      if (code === "ECONNREFUSED") {
        setError(
          `Ollama no está corriendo. Arranca el servicio con: ollama serve (o inicia la app de escritorio de Ollama)`,
        )
      } else {
        setError(`Error de conexión con Ollama: ${err.message}`)
      }
    } else {
      setError("Error desconocido al llamar a Ollama")
    }
    return null
  } finally {
    clearTimeout(timer)
  }
}
