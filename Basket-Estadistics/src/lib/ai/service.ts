import { getTeamBySlug } from "@/lib/data/teams"
import type { TeamProfile } from "@/lib/data/teams"

// Hugging Face Inference API configuration
// Note: In a real app, you would store this in environment variables
// For this implementation, we'll handle it in the API route to keep the key secure

export interface AIAdvisorRequest {
  teamSlug: string
  leagueSlug: string
  userMessage: string
}

export interface AIAdvisorResponse {
  content: string
  error?: string
}

export class AIAdvisorService {
  /**
   * Get AI advice for team signings
   * @param request Contains team info and user's question
   * @returns AI response with recommendations
   */
  static async getAdvisorAdvice(
    request: AIAdvisorRequest,
  ): Promise<AIAdvisorResponse> {
    try {
      // Fetch detailed team data
      const team = await getTeamBySlug(request.leagueSlug, request.teamSlug)

      if (!team) {
        return {
          content: "No se pudo encontrar el equipo especificado.",
          error: "Team not found",
        }
      }

      // Construct the prompt with team context
      const prompt = this.buildPrompt(team, request.userMessage)

      // Return the prompt for the API route to process
      return {
        content: prompt,
      }
    } catch (error) {
      console.error("Error in AI advisor service:", error)
      return {
        content:
          "Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Build a detailed prompt for the AI model with team context
   */
  private static buildPrompt(team: TeamProfile, userMessage: string): string {
    // Extract key information about the team
    const { name, league, roster, seasonStats } = team

    // Build roster summary
    const rosterSummary = roster
      .slice(0, 5)
      .map((player) => `${player.fullName} (${player.position || "N/A"})`)
      .join(", ")

    const rosterNote =
      roster.length > 5
        ? `${rosterSummary} y ${roster.length - 5} más`
        : rosterSummary

    // Build season stats summary
    const statsSummary = seasonStats
      ? `Temporada actual: ${seasonStats.wins}-${seasonStats.losses} (${(seasonStats.winPct ?? 0) * 100}% de victorias)`
      : "Estadísticas de temporada no disponibles"

    return `
Eres un asesor experto en fichajes de baloncesto con conocimiento profundo de las ligas NBA, EuroLeague y ACB. 
Tu tarea es analizar las necesidades de un equipo y proporcionar recomendaciones específicas de fichajes.

INFORMACIÓN DEL EQUIPO:
- Nombre: ${name}
- Liga: ${league.name} (${league.country})
- Plantilla actual: ${rosterNote}
- Rendimiento reciente: ${statsSummary}

CONSULTA DEL USUARIO:
"${userMessage}"

INSTRUCCIONES:
1. Analiza la solicitud del usuario en el contexto del equipo y liga específicos
2. Considera factores como: ajuste táctico, necesidades de posición, química de equipo, valor de mercado, y disponibilidad de jugadores
3. Proporciona 2-3 recomendaciones específicas de jugadores que actualmente están disponibles (agentes libres, en último año de contrato, etc.)
4. Para cada recomendación, explica:
   - Por qué encaja con el equipo
   - Qué aportaría específicamente
   - Posibles desafíos o consideraciones
5. Mantén un tono profesional pero accesible
6. Responde en español
7. Si no tienes suficiente información para dar una recomendación fundamentada, indica qué datos adicionales necesitarías

RESPUESTA:
`
  }
}
