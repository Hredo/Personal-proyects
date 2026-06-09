"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { MessageBubble } from "./message-bubble"
import { AdvisorResponse } from "./advisor-response"
import type { Reaction } from "./message-actions"
import type { AdvisorOutput } from "@/lib/ai/local-advisor"

type Msg = {
  id: number
  type: "user" | "ai"
  content: string
  data?: AdvisorOutput
}

type Props = {
  messages: Msg[]
  loading: boolean
  reactions: Record<number, Reaction>
  onCopy: (id: number) => void
  onLike: (id: number) => void
  onDislike: (id: number) => void
  onRedo: (id: number) => void
  lastMessageRef?: (el: HTMLDivElement | null) => void
}

export function ChatWindow({
  messages,
  loading,
  reactions,
  onCopy,
  onLike,
  onDislike,
  onRedo,
  lastMessageRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const internalLastRef = useRef<HTMLDivElement | null>(null)
  const focusLast = useRef<((el: HTMLDivElement | null) => void) | undefined>(
    lastMessageRef,
  )
  focusLast.current = lastMessageRef

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

  // Move focus to the last AI message whenever a new one lands, so screen
  // readers announce the new response.
  useEffect(() => {
    if (messages.length === 0) return
    const last = messages[messages.length - 1]
    if (last.type !== "ai") return
    const node = internalLastRef.current
    if (!node) return
    // Defer to allow the message to render.
    const t = window.setTimeout(() => {
      node.focus({ preventScroll: false })
      focusLast.current?.(node)
    }, 80)
    return () => window.clearTimeout(t)
  }, [messages])

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-md"
        >
          <div className="relative mx-auto mb-5 h-16 w-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-400/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-brand-400"
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
          </div>
          <h3 className="text-lg font-semibold text-ink-100">
            Asesor de Fichajes
          </h3>
          <p className="mt-2 text-sm text-ink-400 leading-relaxed">
            Selecciona un equipo y pregúntale qué fichajes recomienda para
            reforzar la plantilla. Analizo tu roster, detecto necesidades y
            sugiero jugadores reales del mercado.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
      <div
          ref={containerRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversación con el asesor"
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        >
      {messages.map((msg, idx) => {
        const isLastAi = msg.type === "ai" && idx === messages.length - 1
        const prev = idx > 0 ? messages[idx - 1] : null
        const canRedo = isLastAi && prev?.type === "user"

        if (msg.type === "ai" && msg.data) {
          return (
            <div
              key={msg.id}
              ref={isLastAi ? internalLastRef : undefined}
              tabIndex={isLastAi ? -1 : undefined}
              aria-label={isLastAi ? "Última respuesta del asesor" : undefined}
              className="focus:outline-none"
            >
              <AdvisorResponse data={msg.data} />
              <BubbleActions
                content={msg.data.analysis}
                reaction={reactions[msg.id] ?? null}
                onCopy={() => onCopy(msg.id)}
                onLike={() => onLike(msg.id)}
                onDislike={() => onDislike(msg.id)}
                onRedo={() => onRedo(msg.id)}
                canRedo={canRedo}
              />
            </div>
          )
        }

        return (
          <div
            key={msg.id}
            ref={isLastAi ? internalLastRef : undefined}
            tabIndex={isLastAi ? -1 : undefined}
            aria-label={isLastAi ? "Última respuesta del asesor" : undefined}
            className="focus:outline-none"
          >
            <MessageBubble
              type={msg.type}
              content={msg.content}
              reaction={reactions[msg.id] ?? null}
              onCopy={() => onCopy(msg.id)}
              onLike={() => onLike(msg.id)}
              onDislike={() => onDislike(msg.id)}
              onRedo={() => onRedo(msg.id)}
              canRedo={canRedo}
            />
          </div>
        )
      })}

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-ink-700/50 bg-ink-800/60 px-4 py-3 backdrop-blur">
            <div className="flex gap-1.5" aria-hidden>
              <span
                className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-xs text-ink-400">
              Analizando plantilla y mercado...
            </span>
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

type BubbleActionsProps = {
  content: string
  reaction: Reaction
  onCopy: () => void
  onLike: () => void
  onDislike: () => void
  onRedo: () => void
  canRedo: boolean
}

function BubbleActions({
  content,
  reaction,
  onCopy,
  onLike,
  onDislike,
  onRedo,
  canRedo,
}: BubbleActionsProps) {
  return (
    <div className="mt-1.5 flex items-center gap-1.5 px-1">
      <CopyAction content={content} onCopy={onCopy} />
      <LikeAction active={reaction === "up"} onClick={onLike} />
      <DislikeAction active={reaction === "down"} onClick={onDislike} />
      <RedoAction disabled={!canRedo} onClick={onRedo} />
    </div>
  )
}

function CopyAction({
  content,
  onCopy,
}: {
  content: string
  onCopy: () => void
}) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(content)
          } else {
            const ta = document.createElement("textarea")
            ta.value = content
            ta.style.position = "fixed"
            ta.style.opacity = "0"
            document.body.appendChild(ta)
            ta.select()
            document.execCommand("copy")
            document.body.removeChild(ta)
          }
        } catch (err) {
          console.error("Copy failed:", err)
        }
        onCopy()
      }}
      aria-label="Copiar respuesta"
      title="Copiar"
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-ink-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-ink-100"
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
      </svg>
    </button>
  )
}

function LikeAction({
  active,
  onClick,
}: {
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Me gusta esta respuesta"
      aria-pressed={active}
      title="Me gusta"
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
        active
          ? "border-brand-400/50 bg-brand-500/15 text-brand-200"
          : "border-white/10 bg-white/[0.03] text-ink-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-ink-100"
      }`}
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path d="M7 10v11" />
        <path d="M21 11.5a2.5 2.5 0 0 0-2.5-2.5h-5l.8-4.2a1.7 1.7 0 0 0-.4-1.5 1.5 1.5 0 0 0-2.4.3L8 10H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12.4a2 2 0 0 0 2-1.6l1.5-7.4a2 2 0 0 0 .1-.5Z" />
      </svg>
    </button>
  )
}

function DislikeAction({
  active,
  onClick,
}: {
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="No me gusta esta respuesta"
      aria-pressed={active}
      title="No me gusta"
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
        active
          ? "border-brand-400/50 bg-brand-500/15 text-brand-200"
          : "border-white/10 bg-white/[0.03] text-ink-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-ink-100"
      }`}
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path d="M17 14V3" />
        <path d="M3 12.5A2.5 2.5 0 0 0 5.5 15h5l-.8 4.2a1.7 1.7 0 0 0 .4 1.5 1.5 1.5 0 0 0 2.4-.3L16 14h4a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H7.6a2 2 0 0 0-2 1.6L4.1 12a2 2 0 0 0-.1.5Z" />
      </svg>
    </button>
  )
}

function RedoAction({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Rehacer respuesta"
      title="Rehacer"
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-ink-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-ink-100 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path d="M21 7v6h-6" />
        <path d="M3 17a9 9 0 0 1 15-6.7L21 13" />
      </svg>
    </button>
  )
}
