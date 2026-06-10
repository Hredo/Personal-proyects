"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

const TOUR_KEY = "ai-advisor:tour-done"
export const TOUR_EVENT = "advisor:start-tour"

type Step = {
  id: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    id: "team",
    title: "Pick a team",
    body: "Everything starts here. Search any club across the NBA, EuroLeague and ACB — the advisor analyses its current roster before answering.",
  },
  {
    id: "engine",
    title: "Choose your AI engine",
    body: "Run a local LLM through Ollama (private and free) or connect API keys. With no AI connected, the advisor still answers in fast basic mode.",
  },
  {
    id: "chat",
    title: "Read the analysis",
    body: "Answers appear here: a roster diagnosis, the gap the advisor detects and a shortlist of real candidates ranked by priority.",
  },
  {
    id: "input",
    title: "Ask in plain language",
    body: "Type your question — \"I need a scoring wing\" — and press Ctrl+Enter or the send button.",
  },
  {
    id: "export",
    title: "Export your work",
    body: "Download the whole conversation as PDF, Word or Markdown to share with your staff.",
  },
  {
    id: "new-chat",
    title: "Start fresh anytime",
    body: "New chat clears the board. Your previous conversations stay saved below it.",
  },
  {
    id: "conversations",
    title: "Pick up where you left off",
    body: "Chats are private to your account. Click one to reopen it, hover to delete it.",
  },
]

type Rect = { top: number; left: number; width: number; height: number }

function isVisible(el: Element | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false
  if (el.offsetParent === null && getComputedStyle(el).position !== "fixed")
    return false
  const r = el.getBoundingClientRect()
  return r.width > 4 && r.height > 4
}

function targetFor(id: string): HTMLElement | null {
  const el = document.querySelector(`[data-tour="${id}"]`)
  return isVisible(el) ? el : null
}

function readDone(): boolean {
  try {
    return window.localStorage.getItem(TOUR_KEY) === "1"
  } catch {
    return true
  }
}

function writeDone(): void {
  try {
    window.localStorage.setItem(TOUR_KEY, "1")
  } catch {}
}

export function AdvisorTour() {
  const [phase, setPhase] = useState<"idle" | "welcome" | "tour">("idle")
  const [steps, setSteps] = useState<Step[]>([])
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // First visit → offer the tour. Replays come through the TOUR_EVENT.
  useEffect(() => {
    if (!readDone()) {
      const t = window.setTimeout(() => setPhase("welcome"), 450)
      return () => window.clearTimeout(t)
    }
  }, [])

  const beginTour = useCallback(() => {
    const visible = STEPS.filter((s) => targetFor(s.id))
    if (visible.length === 0) {
      writeDone()
      setPhase("idle")
      return
    }
    setSteps(visible)
    setIdx(0)
    setPhase("tour")
  }, [])

  useEffect(() => {
    const onReplay = () => beginTour()
    window.addEventListener(TOUR_EVENT, onReplay)
    return () => window.removeEventListener(TOUR_EVENT, onReplay)
  }, [beginTour])

  const endTour = useCallback(() => {
    writeDone()
    setPhase("idle")
    setRect(null)
  }, [])

  // Track the active target's rect; follow scroll and resize.
  useEffect(() => {
    if (phase !== "tour") return
    const step = steps[idx]
    if (!step) return
    const el = targetFor(step.id)
    if (!el) {
      // Target disappeared (e.g. responsive change) — advance or finish.
      if (idx < steps.length - 1) setIdx((i) => i + 1)
      else endTour()
      return
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" })

    let raf = 0
    const measure = () => {
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    measure()
    const settle = window.setTimeout(measure, 380)
    window.addEventListener("scroll", schedule, true)
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(settle)
      window.removeEventListener("scroll", schedule, true)
      window.removeEventListener("resize", schedule)
    }
  }, [phase, steps, idx, endTour])

  // Keyboard: Esc exits, arrows navigate.
  useEffect(() => {
    if (phase === "idle") return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        endTour()
      }
      if (phase !== "tour") return
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault()
        setIdx((i) => {
          if (i >= steps.length - 1) {
            endTour()
            return i
          }
          return i + 1
        })
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        setIdx((i) => Math.max(0, i - 1))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, steps.length, endTour])

  if (phase === "idle") return null

  if (phase === "welcome") {
    return (
      <AnimatePresence>
        <motion.div
          key="tour-welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-welcome-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/60"
          >
            <div
              aria-hidden
              className="h-1 w-full bg-gradient-to-r from-brand-500 via-ember-400 to-brand-600"
            />
            <div className="p-6 sm:p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/25">
                <svg
                  className="h-5 w-5 text-brand-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
              <h2
                id="tour-welcome-title"
                className="mt-4 font-display text-xl font-bold text-ink-50 sm:text-2xl"
              >
                Welcome to the Scouting Advisor
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">
                Your assistant for signings: it analyses a roster, detects gaps
                and shortlists real players. Want a 60-second walkthrough of
                how it works?
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={beginTour}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400"
                >
                  Take the tour
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14M13 6l6 6-6 6"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={endTour}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-ink-200 transition hover:border-white/25 hover:text-ink-50"
                >
                  Skip for now
                </button>
              </div>
              <p className="mt-4 text-center text-[11px] text-ink-500">
                You can replay it anytime from the{" "}
                <span className="font-semibold text-ink-400">Tour</span> button
                in the header.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── Tour phase ──────────────────────────────────────────────────────
  const step = steps[idx]
  if (!step || !rect) return null

  const pad = 8
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280
  const vh = typeof window !== "undefined" ? window.innerHeight : 800
  const ttW = Math.min(340, vw - 24)
  const ttH = tooltipRef.current?.offsetHeight ?? 190
  const below = rect.top + rect.height + pad + 12 + ttH < vh
  const ttTop = below
    ? rect.top + rect.height + pad + 12
    : Math.max(12, rect.top - pad - 12 - ttH)
  const ttLeft = Math.min(
    Math.max(12, rect.left + rect.width / 2 - ttW / 2),
    vw - ttW - 12,
  )
  const isLast = idx === steps.length - 1

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      {/* Click shield: keeps the page inert while touring */}
      <div className="absolute inset-0" onClick={endTour} aria-hidden />

      {/* Spotlight on the target */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className="pointer-events-none absolute rounded-2xl ring-2 ring-brand-400"
        style={{ boxShadow: "0 0 0 200vmax rgba(3, 6, 12, 0.78)" }}
      />

      {/* Tooltip */}
      <motion.div
        ref={tooltipRef}
        key={step.id}
        initial={{ opacity: 0, y: below ? 8 : -8 }}
        animate={{ opacity: 1, y: 0, top: ttTop, left: ttLeft }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{ width: ttW }}
        className="absolute rounded-2xl border border-white/10 bg-ink-900 p-4 shadow-2xl shadow-black/60"
        aria-labelledby="tour-step-title"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-brand-300">
            Step {idx + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={endTour}
            className="rounded-md px-1.5 py-0.5 text-[11px] text-ink-500 transition hover:bg-white/5 hover:text-ink-200"
          >
            Skip tour
          </button>
        </div>
        <h3
          id="tour-step-title"
          className="mt-2.5 font-display text-base font-bold text-ink-50"
        >
          {step.title}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-300">
          {step.body}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1" aria-hidden>
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === idx ? "w-5 bg-brand-400" : "w-1.5 bg-white/15"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-ink-200 transition hover:border-white/25 hover:text-ink-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => (isLast ? endTour() : setIdx((i) => i + 1))}
              className="rounded-lg bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-ink-950 transition hover:bg-brand-400"
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AdvisorTour
