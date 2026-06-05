"use client"

import { useState, useRef, useEffect, useId } from "react"
import { DownloadMenu } from "./download-menu"
import type { ChatMessage, TeamContext } from "@/lib/ai/export"

type Props = {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  team: TeamContext | null
  messages: ChatMessage[]
}

export function InputArea({
  onSend,
  disabled = false,
  loading = false,
  placeholder = "Escribe tu mensaje...",
  team,
  messages,
}: Props) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const helpId = useId()

  // Focus the input only on first mount (or when the user just enabled a
  // team). After that, ChatWindow is in charge of moving focus to the new
  // AI message — we don't want to steal it back.
  useEffect(() => {
    if (disabled) return
    inputRef.current?.focus({ preventScroll: true })
  }, [disabled])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim().slice(0, 2000)
    if (!trimmed || disabled || loading) return
    await onSend(trimmed)
    setInput("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-white/5 bg-ink-950/40 px-4 py-3 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 2000))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={2000}
          aria-label="Pregunta para el asesor"
          aria-describedby={helpId}
          className="flex-1 rounded-xl border border-ink-700 bg-ink-800/60 px-4 py-2.5 text-sm text-ink-50 placeholder-ink-400 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-40"
        />
        <DownloadMenu team={team} messages={messages} disabled={disabled} />
        <button
          type="submit"
          disabled={disabled || loading || !input.trim()}
          aria-label="Enviar mensaje"
          aria-keyshortcuts="Control+Enter"
          title="Enviar (Ctrl+Enter)"
          className="shrink-0 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-400 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        >
          {loading ? (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          )}
        </button>
      </div>
      <p id={helpId} className="mt-1.5 px-1 text-[10px] text-ink-500">
        Preguntas en español se procesan más rápido · Pulsa{" "}
        <kbd className="rounded border border-ink-700 bg-ink-800/60 px-1 font-mono text-[9px] text-ink-300">
          Ctrl
        </kbd>
        {" + "}
        <kbd className="rounded border border-ink-700 bg-ink-800/60 px-1 font-mono text-[9px] text-ink-300">
          Enter
        </kbd>{" "}
        para enviar
      </p>
    </form>
  )
}
