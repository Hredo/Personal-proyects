"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { TeamSelector } from "@/app/ai-advisor/team-selector"
import { ChatWindow } from "@/app/ai-advisor/chat-window"
import { InputArea } from "@/app/ai-advisor/input-area"
import {
  LlmSettings,
  loadLlmMode,
  type LlmMode,
} from "@/app/ai-advisor/llm-settings"
import type { TeamOption } from "@/types/teams"
import type { AdvisorOutput } from "@/lib/ai/local-advisor"
import type { Reaction } from "@/app/ai-advisor/message-actions"

type Message = {
  id: number
  type: "user" | "ai"
  content: string
  data?: AdvisorOutput
}

type AdvisorApiResult = {
  content?: string
  data?: AdvisorOutput
  mode?: "llm" | "local"
  error?: boolean
}

const TIPS = [
  "Quiero un buen defensor para el equipo",
  "Necesito un anotador exterior",
  "Buscamos un base organizador",
  "Refuerzo para el juego interior",
  "Una opción económica para la rotación",
  "Fichaje estrella de impacto inmediato",
]

const REACTIONS_KEY = "ai-advisor:reactions"

function loadReactions(): Record<number, Reaction> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(REACTIONS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === "object") {
      return parsed as Record<number, Reaction>
    }
  } catch {}
  return {}
}

function clearReactions(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(REACTIONS_KEY)
  } catch {}
}

export default function AIAdvisorClient() {
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [reactions, setReactions] = useState<Record<number, Reaction>>({})
  const [llmMode, setLlmMode] = useState<LlmMode>("off")
  const idRef = useRef(0)

  useEffect(() => {
    setReactions(loadReactions())
    setLlmMode(loadLlmMode())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactions))
    } catch {}
  }, [reactions])

  const handleTeamChange = (team: TeamOption) => {
    setSelectedTeam(team)
    setMessages([])
    setReactions({})
    clearReactions()
  }

  const sendMessage = useCallback(
    async (content: string) => {
      if (!selectedTeam) return
      const userId = ++idRef.current
      const userMsg: Message = { id: userId, type: "user", content }
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (llmMode === "ollama") headers["X-User-LLM"] = "ollama"

        const res = await fetch("/api/ai-advisor", {
          method: "POST",
          headers,
          body: JSON.stringify({
            teamSlug: selectedTeam.slug,
            leagueSlug: selectedTeam.leagueSlug,
            userMessage: content,
            history: messages.map((m) => ({
              role: m.type === "user" ? "user" : "assistant",
              content: m.content,
            })),
          }),
        })
        const result = (await res.json()) as AdvisorApiResult
        if (!res.ok && res.status === 429) {
          const aiId = ++idRef.current
          setMessages((prev) => [
            ...prev,
            {
              id: aiId,
              type: "ai",
              content:
                result.content ||
                "Has enviado demasiados mensajes seguidos. Espera unos segundos.",
            },
          ])
          return
        }
        const aiId = ++idRef.current
        const aiMsg: Message = {
          id: aiId,
          type: "ai",
          content: result.content || "",
          data: result.data,
        }
        setMessages((prev) => [...prev, aiMsg])
      } catch {
        const aiId = ++idRef.current
        setMessages((prev) => [
          ...prev,
          {
            id: aiId,
            type: "ai",
            content:
              "No pudimos llegar al asesor. Comprueba tu conexión o inténtalo en unos segundos.",
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [selectedTeam, messages, llmMode],
  )

  const handleRedo = useCallback(
    async (aiMessageId: number) => {
      if (!selectedTeam || loading) return
      const idx = messages.findIndex((m) => m.id === aiMessageId)
      if (idx <= 0) return
      const prevUser = messages[idx - 1]
      if (!prevUser || prevUser.type !== "user") return

      const userContent = prevUser.content
      const before = messages.slice(0, idx)
      const history = before.slice(0, -1).map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.content,
      }))

      setMessages(before)
      setLoading(true)
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (llmMode === "ollama") headers["X-User-LLM"] = "ollama"

        const r = await fetch("/api/ai-advisor", {
          method: "POST",
          headers,
          body: JSON.stringify({
            teamSlug: selectedTeam.slug,
            leagueSlug: selectedTeam.leagueSlug,
            userMessage: userContent,
            history,
          }),
        })
        const result = (await r.json()) as AdvisorApiResult
        const newAiId = ++idRef.current
        setMessages((cur) => [
          ...cur,
          {
            id: newAiId,
            type: "ai",
            content: result.content || "",
            data: result.data,
          },
        ])
        setReactions((r) => {
          const copy = { ...r }
          delete copy[aiMessageId]
          return copy
        })
      } catch {
        const newAiId = ++idRef.current
        setMessages((cur) => [
          ...cur,
          {
            id: newAiId,
            type: "ai",
            content:
              "No pudimos rehacer la respuesta. Inténtalo de nuevo en unos segundos.",
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [selectedTeam, loading, messages, llmMode],
  )

  const handleCopy = useCallback((id: number) => {
    setReactions((prev) => {
      if (prev[id] === "up") return prev
      return { ...prev, [id]: prev[id] === "down" ? null : "up" }
    })
  }, [])

  const handleLike = useCallback((id: number) => {
    setReactions((prev) => {
      const cur = prev[id] ?? null
      return { ...prev, [id]: cur === "up" ? null : "up" }
    })
  }, [])

  const handleDislike = useCallback((id: number) => {
    setReactions((prev) => {
      const cur = prev[id] ?? null
      return { ...prev, [id]: cur === "down" ? null : "down" }
    })
  }, [])

  const teamContext = selectedTeam
    ? {
        name: selectedTeam.name,
        slug: selectedTeam.slug,
        leagueSlug: selectedTeam.leagueSlug,
      }
    : null

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-5xl flex-col">
      <header className="border-b border-white/5 bg-ink-950/50 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/25">
            <svg
              className="h-5 w-5 text-brand-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-ink-50">
              Asesor de Fichajes
            </h1>
            <p className="text-xs text-ink-400">
              Análisis inteligente basado en tu base de datos
            </p>
          </div>
        </div>
      </header>

      <LlmSettings mode={llmMode} onModeChange={setLlmMode} />

      <div className="border-b border-white/5 bg-ink-950/30">
        <TeamSelector onTeamChange={handleTeamChange} />
      </div>

      <main className="flex flex-1 flex-col overflow-hidden">
        <ChatWindow
          messages={messages}
          loading={loading}
          reactions={reactions}
          onCopy={handleCopy}
          onLike={handleLike}
          onDislike={handleDislike}
          onRedo={handleRedo}
        />

        {messages.length === 0 && selectedTeam && (
          <div className="border-t border-white/5 bg-ink-950/20 px-4 pb-3 pt-3">
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-brand-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden
              >
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" d="M12 8h.01M11 12h1v4h1" />
              </svg>
              <p className="text-[11px] leading-relaxed text-ink-300">
                <span className="font-semibold text-brand-200">
                  Por qué este asesor.
                </span>{" "}
                Analiza tu plantilla contra la base de datos de 2400+ jugadores,
                busca los huecos posicionales y propone shortlists. Todo sin
                salir del navegador.
              </p>
            </div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-ink-500">
              Preguntas sugeridas
            </p>
            <div className="flex flex-wrap gap-2">
              {TIPS.map((tip) => (
                <button
                  key={tip}
                  type="button"
                  onClick={() => sendMessage(tip)}
                  disabled={loading}
                  className="rounded-full border border-ink-700 bg-ink-800/50 px-3 py-1.5 text-xs text-ink-300 transition hover:border-brand-500/50 hover:text-brand-300 disabled:opacity-30"
                >
                  {tip}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <InputArea
        onSend={sendMessage}
        disabled={!selectedTeam}
        loading={loading}
        team={teamContext}
        messages={messages}
        placeholder={
          !selectedTeam
            ? "Selecciona un equipo arriba..."
            : loading
              ? "Analizando..."
              : `Pregunta sobre fichajes para ${selectedTeam.name}...`
        }
      />
    </div>
  )
}
