import { saveAs } from "file-saver"
import type { ChatMessage, TeamContext } from "./export"

const FILE_BASE = "asesor-fichajes"

function escapeMd(input: string): string {
  return input.replace(/([|\\])/g, "\\$1")
}

function formatTeam(team: TeamContext): string {
  const league = team.leagueName ? ` (${team.leagueName})` : ""
  return `**${team.name}**${league}`
}

function formatAiMessage(content: string): string {
  return `${content.trim()}\n`
}

function formatUserMessage(content: string): string {
  return `> ${content.trim()}\n`
}

function buildMarkdown(team: TeamContext, messages: ChatMessage[]): string {
  const lines: string[] = []
  lines.push(`# Asesor de Fichajes`)
  lines.push(``)
  lines.push(`**Equipo:** ${formatTeam(team)}`)
  lines.push(`**Generado:** ${new Date().toLocaleString("es-ES")}`)
  lines.push(`**Mensajes:** ${messages.length}`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)
  lines.push(`## Conversación`)
  lines.push(``)

  messages.forEach((m, i) => {
    const label = m.type === "user" ? `🙋 **Tú**` : `🤖 **Asesor**`
    lines.push(`### ${label} · mensaje ${i + 1}`)
    lines.push(``)
    if (m.type === "user") {
      lines.push(formatUserMessage(m.content))
    } else {
      lines.push(formatAiMessage(m.content))
    }
    if (m.data?.recommendations?.length) {
      lines.push(``)
      lines.push(`**Candidatos:**`)
      lines.push(``)
      lines.push(`| # | Jugador | Pos. | Liga | Edad | Contrato | Prioridad |`)
      lines.push(`|---|---------|------|------|------|----------|-----------|`)
      m.data.recommendations.forEach((r, j) => {
        lines.push(
          `| ${j + 1} | ${escapeMd(r.name)} | ${escapeMd(r.position)} | ${r.league} | ${r.age} | ${escapeMd(r.contractValue)} | ${escapeMd(r.priority)} |`,
        )
      })
    }
    if (m.data?.considerations?.length) {
      lines.push(``)
      lines.push(`**Consideraciones:**`)
      m.data.considerations.forEach((c) => {
        lines.push(`- ${c}`)
      })
    }
    lines.push(``)
  })

  return lines.join("\n")
}

export function exportToMarkdown(payload: {
  team: TeamContext
  messages: ChatMessage[]
}): void {
  const md = buildMarkdown(payload.team, payload.messages)
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
  const safeName = payload.team.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "equipo"
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  saveAs(blob, `${FILE_BASE}-${safeName}-${date}.md`)
}
