"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export type LlmMode = "off" | "ollama"

const STORAGE_KEY = "ai-advisor:llm-mode"
const OLLAMA_TAGS_URL = "http://localhost:11434/api/tags"

type OllamaModel = {
  name: string
  size?: number
  modified_at?: string
}

type OllamaTagsResponse = {
  models?: OllamaModel[]
}

type Status = "checking" | "available" | "unavailable"

type Props = {
  mode: LlmMode
  onModeChange: (mode: LlmMode) => void
}

function readStoredMode(): LlmMode {
  if (typeof window === "undefined") return "off"
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === "ollama" ? "ollama" : "off"
  } catch {
    return "off"
  }
}

function writeStoredMode(mode: LlmMode): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {}
}

function copyText(text: string): void {
  if (typeof navigator === "undefined") return
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text)
  }
}

function formatSize(bytes?: number): string {
  if (!bytes) return ""
  const gb = bytes / 1_000_000_000
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / 1_000_000
  return `${mb.toFixed(0)} MB`
}

function Spinner() {
  return (
    <svg
      className="h-3 w-3 animate-spin"
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

function CpuIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path
        strokeLinecap="round"
        d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"
      />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function LlmSettings({ mode, onModeChange }: Props) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>("checking")
  const [models, setModels] = useState<OllamaModel[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const checkOllama = useCallback(async (): Promise<void> => {
    setStatus("checking")
    try {
      const r = await fetch(OLLAMA_TAGS_URL, { mode: "cors" })
      if (!r.ok) {
        setStatus("unavailable")
        setModels([])
        return
      }
      const data = (await r.json()) as OllamaTagsResponse
      setModels(Array.isArray(data.models) ? data.models : [])
      setStatus("available")
    } catch {
      setStatus("unavailable")
      setModels([])
    }
  }, [])

  useEffect(() => {
    void checkOllama()
  }, [checkOllama])

  function handleToggle(): void {
    if (status !== "available") return
    const next: LlmMode = mode === "ollama" ? "off" : "ollama"
    writeStoredMode(next)
    onModeChange(next)
    if (next === "ollama") setOpen(false)
  }

  function handleCopy(cmd: string): void {
    copyText(cmd)
    setCopied(cmd)
    window.setTimeout(() => setCopied(null), 1500)
  }

  const firstModel = models[0]?.name ?? "llama3.1:8b"
  const isActive = mode === "ollama"
  const detected = status === "available"

  const steps = [
    {
      n: 1,
      title: "Instala Ollama",
      body: "Descarga la app desde",
      link: { label: "ollama.com", href: "https://ollama.com/download" },
    },
    {
      n: 2,
      title: "Descarga el modelo",
      body: "Abre la terminal y ejecuta:",
      cmd: "ollama pull llama3.1:8b",
    },
    {
      n: 3,
      title: "Arranca el servicio",
      body: "Si no usas la app, ejecuta:",
      cmd: "ollama serve",
    },
    {
      n: 4,
      title: "Refresca esta página",
      body: "Detectaremos Ollama automáticamente.",
    },
  ]

  return (
    <div className="w-full border-b border-white/5 bg-ink-950/30 px-4 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-expanded={open}
          aria-controls="llm-settings-panel"
          aria-label="Configurar modelo de lenguaje local"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 text-[11px] text-ink-400 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-ink-200"
        >
          <CpuIcon />
          <span>Modo LLM</span>
          {status === "checking" ? (
            <Spinner />
          ) : detected ? (
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
            />
          ) : (
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink-500" />
          )}
          <ChevronIcon open={open} />
        </button>

        {isActive && (
          <span
            role="status"
            className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
          >
            <span aria-hidden className="h-1 w-1 rounded-full bg-emerald-400" />
            Usando {firstModel}
          </span>
        )}

        {!isActive && detected && (
          <button
            type="button"
            onClick={handleToggle}
            className="rounded-md px-2 py-1 text-[11px] font-semibold text-brand-300 transition hover:bg-brand-500/10"
          >
            Activar mi LLM
          </button>
        )}

        <Link
          href="/account/ai-keys"
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-ink-400 transition hover:text-ink-100"
        >
          Más IAs &amp; API keys →
        </Link>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="llm-settings-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-white/5 bg-ink-900/60 p-3">
              {status === "checking" && (
                <p className="flex items-center gap-2 text-[11px] text-ink-400">
                  <Spinner /> Buscando Ollama en localhost:11434...
                </p>
              )}

              {status === "available" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold text-emerald-300">
                        Ollama detectado
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink-400">
                        {models.length} modelo{models.length === 1 ? "" : "s"}{" "}
                        disponible{models.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggle}
                      className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                        isActive
                          ? "bg-ink-700 text-ink-200 hover:bg-ink-600"
                          : "bg-brand-500 text-ink-950 hover:bg-brand-400"
                      }`}
                    >
                      {isActive ? "Desactivar" : "Usar mi LLM"}
                    </button>
                  </div>

                  {models.length > 0 && (
                    <ul className="space-y-1">
                      {models.slice(0, 4).map((m) => (
                        <li
                          key={m.name}
                          className="flex items-center justify-between gap-2 rounded-md bg-white/[0.02] px-2 py-1 text-[10px] text-ink-300"
                        >
                          <span className="font-mono">{m.name}</span>
                          {m.size ? (
                            <span className="text-ink-500">
                              {formatSize(m.size)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="border-t border-white/5 pt-2 text-[10px] leading-relaxed text-ink-500">
                    Tus datos salen del navegador sólo hacia tu Ollama local. Si
                    Ollama no responde, el asesor usa automáticamente el modo
                    determinista.
                  </p>
                </div>
              )}

              {status === "unavailable" && (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-500"
                    />
                    <p className="text-[11px] text-ink-300">
                      Ollama no está corriendo. Para usar tu propio LLM sigue
                      estos pasos:
                    </p>
                  </div>
                  <ol className="space-y-2 pl-1">
                    {steps.map((s) => (
                      <li
                        key={s.n}
                        className="flex gap-2 text-[11px] text-ink-300"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink-700/60 text-[9px] font-bold text-ink-200">
                          {s.n}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-ink-200">
                            {s.title}
                          </p>
                          <p className="mt-0.5 text-[10px] text-ink-400">
                            {s.body}{" "}
                            {s.link && (
                              <a
                                href={s.link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-300 underline-offset-2 hover:underline"
                              >
                                {s.link.label}
                              </a>
                            )}
                          </p>
                          {s.cmd && (
                            <div className="mt-1 flex items-center gap-1.5 rounded-md border border-white/5 bg-ink-950/60 px-2 py-1">
                              <code className="flex-1 font-mono text-[10px] text-brand-200">
                                {s.cmd}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopy(s.cmd!)}
                                aria-label={`Copiar comando: ${s.cmd}`}
                                className="flex h-5 w-5 items-center justify-center rounded text-ink-400 transition hover:bg-white/5 hover:text-ink-100"
                              >
                                {copied === s.cmd ? (
                                  <span className="text-emerald-400">
                                    <CheckIcon />
                                  </span>
                                ) : (
                                  <CopyIcon />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="flex items-center justify-end border-t border-white/5 pt-2">
                    <button
                      type="button"
                      onClick={() => void checkOllama()}
                      className="text-[10px] font-semibold text-brand-300 hover:underline"
                    >
                      Reintentar detección
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function loadLlmMode(): LlmMode {
  return readStoredMode()
}
