"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  exportToPdf,
  exportToWord,
  type ChatMessage,
  type TeamContext,
} from "@/lib/ai/export"
import { exportToMarkdown } from "@/lib/ai/export-markdown"

type Format = "pdf" | "word" | "markdown"

type Props = {
  team: TeamContext | null
  messages: ChatMessage[]
  disabled?: boolean
}

function DownloadIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
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
  )
}

function FormatIcon({ id }: { id: Format }) {
  if (id === "pdf") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
        <text
          x="8"
          y="17"
          fontSize="6"
          fontWeight="700"
          fill="currentColor"
          stroke="none"
          fontFamily="Helvetica, Arial, sans-serif"
        >
          PDF
        </text>
      </svg>
    )
  }
  if (id === "word") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
        <text
          x="7.5"
          y="17"
          fontSize="6"
          fontWeight="700"
          fill="currentColor"
          stroke="none"
          fontFamily="Helvetica, Arial, sans-serif"
        >
          DOC
        </text>
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
      <text
        x="7.5"
        y="17"
        fontSize="6"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
        fontFamily="Helvetica, Arial, sans-serif"
      >
        MD
      </text>
    </svg>
  )
}

type Option = {
  id: Format
  label: string
  hint: string
  run: (payload: {
    team: TeamContext
    messages: ChatMessage[]
  }) => void | Promise<void>
}

export function DownloadMenu({ team, messages, disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<Format | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  const isEmpty = messages.length === 0
  const isDisabled = disabled || isEmpty || !team || busy !== null

  const options: Option[] = [
    {
      id: "markdown",
      label: "Markdown (.md)",
      hint: "Texto plano, ideal para pegar en docs o Notion",
      run: ({ team, messages }) => exportToMarkdown({ team, messages }),
    },
    {
      id: "pdf",
      label: "PDF (.pdf)",
      hint: "Documento formateado con análisis y fichas",
      run: ({ team, messages }) => exportToPdf({ team, messages }),
    },
    {
      id: "word",
      label: "Word (.docx)",
      hint: "Documento editable con todas las secciones",
      run: ({ team, messages }) => exportToWord({ team, messages }),
    },
  ]

  async function handleSelect(opt: Option) {
    if (!team || isEmpty) return
    setBusy(opt.id)
    setOpen(false)
    try {
      await opt.run({ team, messages })
    } catch (err) {
      console.error("Download failed:", err)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Descargar conversación"
        title={
          isEmpty
            ? "Inicia una conversación para descargar"
            : "Descargar conversación"
        }
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-800/60 text-ink-200 transition hover:border-brand-500/50 hover:bg-ink-800 hover:text-brand-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-700 disabled:hover:bg-ink-800/60 disabled:hover:text-ink-200"
      >
        {busy ? <Spinner /> : <DownloadIcon />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute bottom-full right-0 z-30 mb-2 w-72 origin-bottom-right overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <div className="px-2.5 pb-1.5 pt-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                Formato de descarga
              </p>
            </div>
            <div className="space-y-0.5">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(opt)}
                  disabled={busy !== null}
                  className="group flex w-full items-start gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left transition hover:border-white/10 hover:bg-white/[0.04] disabled:opacity-40"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-ink-200 group-hover:text-brand-200">
                    <FormatIcon id={opt.id} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink-50 group-hover:text-brand-200">
                      {opt.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-ink-400">
                      {opt.hint}
                    </span>
                  </span>
                  {busy === opt.id && <Spinner />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
