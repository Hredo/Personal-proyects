"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { TeamSelector } from "@/app/ai-advisor/team-selector"
import { ChatWindow } from "@/app/ai-advisor/chat-window"
import { InputArea } from "@/app/ai-advisor/input-area"
import {
  LlmSettings,
  loadLlmMode,
  type LlmMode,
} from "@/app/ai-advisor/llm-settings"
import { AdvisorTour, TOUR_EVENT } from "@/app/ai-advisor/tour"
// NOTE: Import kept for when paywall is re-enabled.
// import { PaywallModal } from "@/components/auth/paywall-modal"
import type { TeamOption } from "@/types/teams"
import type { AdvisorOutput } from "@/lib/ai/local-advisor"
import type { Reaction } from "@/app/ai-advisor/message-actions"

type Message = {
  id: number
  type: "user" | "ai"
  content: string
  data?: AdvisorOutput
  mode?: "llm" | "local"
  model?: string
}

type AdvisorApiResult = {
  content?: string
  data?: AdvisorOutput
  mode?: "llm" | "local"
  model?: string
  provider?: string
  aiConfigured?: boolean
  aiReason?: string | null
  conversationId?: string
  error?: boolean
}

type ConversationSummary = {
  id: string
  teamSlug: string
  teamName: string
  leagueSlug: string
  title: string
  createdAt: string
  updatedAt: string
}

type ConversationDetail = ConversationSummary & {
  messages: Array<{
    id: string
    role: "user" | "assistant"
    content: string
    model: string | null
    mode: string | null
    createdAt: string
  }>
}

const TIPS = [
  "I want a strong defender for the team",
  "I need a scoring wing",
  "Looking for a playmaking point guard",
  "Reinforcement for the frontcourt",
  "A budget-friendly option for the rotation",
  "Star signing with immediate impact",
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

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ""
  const diff = Date.now() - t
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  return new Date(iso).toLocaleDateString()
}

export default function AIAdvisorClient() {
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [reactions, setReactions] = useState<Record<number, Reaction>>({})
  const [llmMode, setLlmMode] = useState<LlmMode>("off")
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  )
  const [loadingConversation, setLoadingConversation] = useState(false)
  // NOTE: paywall state kept for when paywall is re-enabled.
  // const [paywall, setPaywall] = useState<"auth" | "quota" | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aiNotConfigured, setAiNotConfigured] = useState(false)
  const [aiNoticeDismissed, setAiNoticeDismissed] = useState(false)
  const idRef = useRef(0)
  const initialized = useRef(false)

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

  const loadConversationList = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" })
      if (res.status === 401) {
        setConversations([])
        return
      }
      if (!res.ok) return
      const data = (await res.json()) as { conversations?: ConversationSummary[] }
      if (Array.isArray(data.conversations)) {
        setConversations(data.conversations)
      }
    } catch {
      // best-effort
    }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    loadConversationList()
  }, [loadConversationList])

  const handleTeamChange = useCallback(
    (team: TeamOption) => {
      setSelectedTeam(team)
      setMessages([])
      setReactions({})
      clearReactions()
      setActiveConversationId(null)
    },
    [],
  )

  const openConversation = useCallback(
    async (id: string) => {
      setLoadingConversation(true)
      setSidebarOpen(false)
      try {
        const res = await fetch(`/api/conversations/${id}`, {
          cache: "no-store",
        })
        // NOTE: Paywall disabled until re-enabled later.
        // if (res.status === 401) {
        //   setPaywall("auth")
        //   return
        // }
        if (!res.ok) return
        const data = (await res.json()) as {
          conversation: ConversationSummary
          messages: ConversationDetail["messages"]
        }
        const conv = data.conversation
        if (!conv) return
        setActiveConversationId(conv.id)
        const teamOption: TeamOption = {
          id: "",
          name: conv.teamName,
          slug: conv.teamSlug,
          leagueSlug: conv.leagueSlug,
        }
        setSelectedTeam(teamOption)
        idRef.current = 0
        const next: Message[] = (data.messages ?? []).map((m) => ({
          id: ++idRef.current,
          type: m.role === "user" ? "user" : "ai",
          content: m.content,
          mode: (m.mode as "llm" | "local" | undefined) ?? undefined,
          model: m.model ?? undefined,
        }))
        setMessages(next)
        setReactions({})
        clearReactions()
      } finally {
        setLoadingConversation(false)
      }
    },
    [],
  )

  const startNewChat = useCallback(() => {
    setActiveConversationId(null)
    setMessages([])
    setReactions({})
    clearReactions()
    setSidebarOpen(false)
  }, [])

  const deleteConversation = useCallback(
    async (id: string) => {
      const ok =
        typeof window !== "undefined"
          ? window.confirm("Delete this conversation?")
          : true
      if (!ok) return
      try {
        await fetch(`/api/conversations?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        })
      } catch {
        // best-effort
      }
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeConversationId === id) {
        startNewChat()
      }
    },
    [activeConversationId, startNewChat],
  )

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

        const body: Record<string, unknown> = {
          teamSlug: selectedTeam.slug,
          leagueSlug: selectedTeam.leagueSlug,
          userMessage: content,
          history: messages.map((m) => ({
            role: m.type === "user" ? "user" : "assistant",
            content: m.content,
          })),
        }
        if (activeConversationId) {
          body.conversationId = activeConversationId
        } else {
          body.conversationTitle = `${selectedTeam.name} - ${content.slice(0, 60)}`
        }

        const res = await fetch("/api/ai-advisor", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        })
        const result = (await res.json()) as AdvisorApiResult
        // NOTE: Paywall disabled until re-enabled later.
        // if (res.status === 401) {
        //   setPaywall("auth")
        //   setMessages((prev) => prev.filter((m) => m.id !== userId))
        //   return
        // }
        // if (
        //   res.status === 403 &&
        //   (result as { error?: string })?.error === "free_quota_exceeded"
        // ) {
        //   setPaywall("quota")
        //   setMessages((prev) => prev.filter((m) => m.id !== userId))
        //   return
        // }
        if (!res.ok && res.status === 429) {
          const aiId = ++idRef.current
          setMessages((prev) => [
            ...prev,
            {
              id: aiId,
              type: "ai",
              content:
                result.content ||
                "You sent too many messages in a row. Please wait a few seconds.",
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
          mode: result.mode,
          model: result.model,
        }
        setMessages((prev) => [...prev, aiMsg])
        if (result.mode === "llm") setAiNotConfigured(false)
        else if (result.aiConfigured === false) setAiNotConfigured(true)
        if (result.conversationId) {
          setActiveConversationId(result.conversationId)
          loadConversationList()
        }
      } catch {
        const aiId = ++idRef.current
        setMessages((prev) => [
          ...prev,
          {
            id: aiId,
            type: "ai",
            content:
              "We couldn't reach the advisor. Check your connection or try again in a few seconds.",
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [selectedTeam, messages, llmMode, activeConversationId, loadConversationList],
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
            conversationId: activeConversationId ?? undefined,
          }),
        })
        const result = (await r.json()) as AdvisorApiResult
        // NOTE: Paywall disabled until re-enabled later.
        // if (r.status === 401) {
        //   setPaywall("auth")
        //   return
        // }
        // if (
        //   r.status === 403 &&
        //   (result as { error?: string })?.error === "free_quota_exceeded"
        // ) {
        //   setPaywall("quota")
        //   return
        // }
        const newAiId = ++idRef.current
        setMessages((cur) => [
          ...cur,
          {
            id: newAiId,
            type: "ai",
            content: result.content || "",
            data: result.data,
            mode: result.mode,
            model: result.model,
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
              "We couldn't regenerate the response. Please try again in a few seconds.",
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [selectedTeam, loading, messages, llmMode, activeConversationId],
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

  const sortedConversations = useMemo(() => {
    return [...conversations].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }, [conversations])

  return (
    <div className="mx-auto max-w-7xl pb-8 pt-4 lg:pt-6">
      <AnimatePresence>
        {sidebarOpen ? (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-ink-950/60 backdrop-blur-sm lg:hidden"
          />
        ) : null}
      </AnimatePresence>

      <div className="flex items-start gap-0 lg:gap-5">
        {/* ── Conversations sidebar ───────────────────────────────── */}
        <aside
          aria-label="Conversations"
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-ink-950/95 backdrop-blur-md transition-transform duration-300 lg:sticky lg:inset-y-auto lg:top-[76px] lg:z-10 lg:h-[calc(100dvh-92px)] lg:w-64 lg:translate-x-0 lg:self-start lg:rounded-2xl lg:border lg:border-white/10 lg:bg-ink-950/40 lg:backdrop-blur-none xl:w-72 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col gap-2 border-b border-white/10 p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startNewChat}
                data-tour="new-chat"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400 active:scale-[0.98]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  aria-hidden
                >
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
                New chat
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close conversations"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-ink-300 transition hover:border-white/25 hover:text-ink-50 lg:hidden"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <p className="px-1 pt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Conversations
            </p>
          </div>

          <div
            className="flex-1 overflow-y-auto px-2 pb-3 pt-2"
            data-tour="conversations"
          >
            {sortedConversations.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <svg
                  className="mx-auto h-8 w-8 text-ink-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h8m-8 4h5m-8.5 6.5 2.6-2.6H18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12.5Z"
                  />
                </svg>
                <p className="mt-3 text-xs leading-relaxed text-ink-500">
                  No conversations yet.
                  <br />
                  Pick a team and start a chat.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {sortedConversations.map((c) => {
                  const active = c.id === activeConversationId
                  return (
                    <li
                      key={c.id}
                      className={`group relative rounded-xl border transition ${
                        active
                          ? "border-brand-500/40 bg-brand-500/10"
                          : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openConversation(c.id)}
                        aria-current={active ? "true" : undefined}
                        className="block w-full px-3 py-2.5 text-left"
                      >
                        <p className="truncate pr-6 text-sm font-medium text-ink-100">
                          {c.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ink-500">
                          <span className="font-mono uppercase tracking-widest">
                            {c.leagueSlug}
                          </span>
                          <span>·</span>
                          <span>{timeAgo(c.updatedAt)}</span>
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversation(c.id)
                        }}
                        aria-label="Delete conversation"
                        className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-500 opacity-0 transition hover:bg-white/[0.06] hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M4 7h16"
                          />
                        </svg>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-white/10 p-3 text-[11px] leading-relaxed text-ink-500">
            Conversations are private to your account.
          </div>
        </aside>

        {/* ── Console ─────────────────────────────────────────────── */}
        <section
          aria-label="Scouting Advisor console"
          className="flex min-h-[calc(100dvh-150px)] w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-950/40 lg:h-[calc(100dvh-92px)] lg:min-h-0"
        >
          <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-ink-950/50 px-4 py-3 backdrop-blur-sm sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open conversations"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-ink-200 transition hover:border-white/25 hover:text-ink-50 lg:hidden"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                  />
                </svg>
              </button>
              <div
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/25"
              >
                <svg
                  className="h-4.5 w-4.5 text-brand-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="truncate font-display text-base font-bold text-ink-50 sm:text-lg">
                  Scouting Advisor
                </h1>
                <p className="hidden truncate text-[11px] text-ink-400 sm:block sm:text-xs">
                  Smart analysis powered by your player database
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {loadingConversation ? (
                <span
                  role="status"
                  className="font-mono text-[10px] uppercase tracking-widest text-ink-500"
                >
                  Loading…
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event(TOUR_EVENT))}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-ink-200 transition hover:border-brand-400/40 hover:text-ink-50"
              >
                <svg
                  className="h-3.5 w-3.5 text-brand-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    strokeLinecap="round"
                    d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4m.1 3.5h.01"
                  />
                </svg>
                Tour
              </button>
            </div>
          </header>

          <div data-tour="engine">
            <LlmSettings mode={llmMode} onModeChange={setLlmMode} />
          </div>

          {aiNotConfigured && !aiNoticeDismissed ? (
            <div className="flex items-start gap-3 border-b border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5 sm:px-5">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z"
                />
              </svg>
              <p className="flex-1 text-[12px] leading-relaxed text-amber-100/90">
                You&apos;re seeing{" "}
                <span className="font-semibold">basic mode</span>. Connect an
                AI for AI-powered answers —{" "}
                <Link
                  href="/account/ai-keys"
                  className="font-semibold underline underline-offset-2"
                >
                  add a provider
                </Link>{" "}
                or{" "}
                <Link
                  href="/ai-setup"
                  className="font-semibold underline underline-offset-2"
                >
                  read the setup guide
                </Link>
                .
              </p>
              <button
                type="button"
                onClick={() => setAiNoticeDismissed(true)}
                aria-label="Dismiss"
                className="shrink-0 rounded-md p-1 text-amber-200/70 transition hover:bg-white/10 hover:text-amber-100"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ) : null}

          <div
            data-tour="team"
            className="border-b border-white/10 bg-ink-950/30"
          >
            <TeamSelector
              key={activeConversationId ?? "new"}
              onTeamChange={handleTeamChange}
              initialTeam={selectedTeam}
            />
          </div>

          <main data-tour="chat" className="flex flex-1 flex-col overflow-hidden">
            <ChatWindow
              messages={messages}
              loading={loading}
              reactions={reactions}
              onCopy={handleCopy}
              onLike={handleLike}
              onDislike={handleDislike}
              onRedo={handleRedo}
            />

            {messages.length === 0 && selectedTeam ? (
              <div className="border-t border-white/10 bg-ink-950/20 px-4 pb-3 pt-3">
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
                      Why this advisor.
                    </span>{" "}
                    It scans your roster against the full cross-league player
                    database, detects positional gaps and proposes shortlists.
                    All without leaving the browser.
                  </p>
                </div>
                <p className="mb-2 text-[10px] uppercase tracking-widest text-ink-500">
                  Suggested questions — click one to send it
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIPS.map((tip) => (
                    <button
                      key={tip}
                      type="button"
                      onClick={() => sendMessage(tip)}
                      disabled={loading}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-ink-300 transition hover:border-brand-500/50 hover:bg-brand-500/10 hover:text-brand-200 disabled:opacity-30"
                    >
                      {tip}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </main>

          <div data-tour="input">
            <InputArea
              onSend={sendMessage}
              disabled={!selectedTeam}
              loading={loading}
              team={teamContext}
              messages={messages}
              placeholder={
                !selectedTeam
                  ? "Pick a team above to get started…"
                  : loading
                    ? "Analysing…"
                    : `Ask about signings for ${selectedTeam.name}…`
              }
            />
          </div>
        </section>
      </div>

      <AdvisorTour />

      {/* NOTE: Paywall disabled until re-enabled later. */}
      {/* <PaywallModal */}
      {/*   open={paywall !== null} */}
      {/*   onClose={() => setPaywall(null)} */}
      {/*   variant={paywall ?? "auth"} */}
      {/*   feature="advisor" */}
      {/* /> */}
    </div>
  )
}
