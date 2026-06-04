"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { MessageBubble } from "./message-bubble"
import type { Reaction } from "./message-actions"

type Msg = {
  id: number
  type: "user" | "ai"
  content: string
}

type Props = {
  messages: Msg[]
  loading: boolean
  reactions: Record<number, Reaction>
  onCopy: (id: number) => void
  onLike: (id: number) => void
  onDislike: (id: number) => void
  onRedo: (id: number) => void
}

export function ChatWindow({
  messages,
  loading,
  reactions,
  onCopy,
  onLike,
  onDislike,
  onRedo,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

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
              <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-ink-100">Asesor de Fichajes</h3>
          <p className="mt-2 text-sm text-ink-400 leading-relaxed">
            Selecciona un equipo y pregúntale qué fichajes recomienda para reforzar la plantilla. Analizo tu roster, detecto necesidades y sugiero jugadores reales del mercado.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg, idx) => {
        const isLastAi =
          msg.type === "ai" && idx === messages.length - 1
        const prev = idx > 0 ? messages[idx - 1] : null
        const canRedo = isLastAi && prev?.type === "user"
        return (
          <MessageBubble
            key={msg.id}
            type={msg.type}
            content={msg.content}
            reaction={reactions[msg.id] ?? null}
            onCopy={() => onCopy(msg.id)}
            onLike={() => onLike(msg.id)}
            onDislike={() => onDislike(msg.id)}
            onRedo={() => onRedo(msg.id)}
            canRedo={canRedo}
          />
        )
      })}

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-ink-700/50 bg-ink-800/60 px-4 py-3 backdrop-blur">
            <div className="flex gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-ink-400">Analizando plantilla y mercado...</span>
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
