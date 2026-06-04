"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export type Reaction = "up" | "down" | null

type Props = {
  content: string
  reaction: Reaction
  onCopy: () => void
  onLike: () => void
  onDislike: () => void
  onRedo: () => void
  canRedo: boolean
}

function CopyIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )
}

function ThumbsUpIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 10v11" />
      <path d="M21 11.5a2.5 2.5 0 0 0-2.5-2.5h-5l.8-4.2a1.7 1.7 0 0 0-.4-1.5 1.5 1.5 0 0 0-2.4.3L8 10H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12.4a2 2 0 0 0 2-1.6l1.5-7.4a2 2 0 0 0 .1-.5Z" />
    </svg>
  )
}

function ThumbsDownIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 14V3" />
      <path d="M3 12.5A2.5 2.5 0 0 0 5.5 15h5l-.8 4.2a1.7 1.7 0 0 0 .4 1.5 1.5 1.5 0 0 0 2.4-.3L16 14h4a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H7.6a2 2 0 0 0-2 1.6L4.1 12a2 2 0 0 0-.1.5Z" />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 15-6.7L21 13" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

type ActionButtonProps = {
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
}

function ActionButton({
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? "border-brand-400/50 bg-brand-500/15 text-brand-200"
          : "border-white/10 bg-white/[0.03] text-ink-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-ink-100"
      }`}
    >
      {children}
    </button>
  )
}

export function MessageActions({
  content,
  reaction,
  onCopy,
  onLike,
  onDislike,
  onRedo,
  canRedo,
}: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
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
      setCopied(true)
      onCopy()
      setTimeout(() => setCopied(false), 1600)
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <ActionButton label="Copiar" onClick={handleCopy} active={copied}>
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-brand-300"
            >
              <CheckIcon />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <CopyIcon />
            </motion.span>
          )}
        </AnimatePresence>
      </ActionButton>
      <ActionButton
        label="Me gusta"
        onClick={onLike}
        active={reaction === "up"}
      >
        <ThumbsUpIcon />
      </ActionButton>
      <ActionButton
        label="No me gusta"
        onClick={onDislike}
        active={reaction === "down"}
      >
        <ThumbsDownIcon />
      </ActionButton>
      <ActionButton
        label="Rehacer respuesta"
        onClick={onRedo}
        disabled={!canRedo}
      >
        <RedoIcon />
      </ActionButton>
    </div>
  )
}
