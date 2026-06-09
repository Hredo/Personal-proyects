"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

type Panel = {
  index: string
  title: ReactNode
  body: string
  visual: ReactNode
  accent?: string
}

const PANELS: Panel[] = [
  {
    index: "01",
    title: "Six leagues, one feed.",
    body: "NBA, EuroLeague, ACB and Spain's full FEB ladder land in the same pipeline, refreshed the moment each buzzer sounds.",
    accent: "var(--color-brand-500)",
    visual: <LeaguesVisual />,
  },
  {
    index: "02",
    title: "Every number, normalized.",
    body: "Spanish minutes, American possessions, EuroLeague pace — reduced to one model so a 20 here means a 20 there.",
    accent: "var(--color-league-euro-500)",
    visual: <NormalizeVisual />,
  },
  {
    index: "03",
    title: "Compare in two seconds.",
    body: "Drop two names and the bars, radar and shooting splits draw themselves — the leader flagged on every line.",
    accent: "var(--color-accent-cyan)",
    visual: <CompareVisual />,
  },
  {
    index: "04",
    title: "Ask in plain language.",
    body: "The AI advisor reads the same numbers you do and hands back a sourced verdict, not a vibe.",
    accent: "var(--color-accent-violet)",
    visual: <AskVisual />,
  },
  {
    index: "05",
    title: "Export, boardroom-ready.",
    body: "Send any profile or matchup to PDF, Excel or Word with the formatting already done.",
    accent: "var(--color-ember-500)",
    visual: <ExportVisual />,
  },
]

export function ScrollGallery() {
  const [enabled, setEnabled] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  const [vh, setVh] = useState(0)

  // Enable the pinned horizontal scroll only on desktop without reduced motion.
  useEffect(() => {
    const mqDesk = window.matchMedia("(min-width: 768px)")
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setEnabled(mqDesk.matches && !mqReduce.matches)
    update()
    mqDesk.addEventListener("change", update)
    mqReduce.addEventListener("change", update)
    return () => {
      mqDesk.removeEventListener("change", update)
      mqReduce.removeEventListener("change", update)
    }
  }, [])

  // Measure how far the track must travel horizontally.
  useEffect(() => {
    if (!enabled) {
      setDist(0)
      return
    }
    const measure = () => {
      const track = trackRef.current
      const section = sectionRef.current
      if (!track || !section) return
      setDist(Math.max(0, track.scrollWidth - section.clientWidth))
      setVh(window.innerHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (trackRef.current) ro.observe(trackRef.current)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [enabled])

  // Scroll-link: translate the track directly (no React re-render, GPU only).
  useEffect(() => {
    if (!enabled) return
    const onScroll = () => {
      const section = sectionRef.current
      const track = trackRef.current
      if (!section || !track) return
      const total = section.offsetHeight - window.innerHeight
      const scrolled = Math.min(
        Math.max(-section.getBoundingClientRect().top, 0),
        total,
      )
      const p = total > 0 ? scrolled / total : 0
      track.style.transform = `translate3d(${-(p * dist)}px,0,0)`
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [enabled, dist])

  const heading = (
    <div>
      <span className="gh-eyebrow">The pipeline</span>
      <h2 className="mt-3 font-display text-4xl font-bold leading-[0.9] tracking-[-0.04em] text-ink-50 sm:text-5xl md:text-6xl">
        From box score to <span className="text-gradient-brand">verdict.</span>
      </h2>
    </div>
  )

  return (
    <div
      ref={sectionRef}
      className="relative"
      style={enabled ? { height: dist + vh } : undefined}
    >
      {enabled ? (
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">{heading}</div>

          <div
            ref={trackRef}
            className="mt-10 flex w-max items-stretch gap-5 px-4 will-change-transform sm:px-6"
          >
            {PANELS.map((p) => (
              <div
                key={p.index}
                className="w-[78vw] shrink-0 sm:w-[440px] lg:w-[500px]"
              >
                <PanelCard panel={p} />
              </div>
            ))}
            <div aria-hidden className="w-[8vw] shrink-0" />
          </div>

          <div className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
            <div className="h-px w-full overflow-hidden bg-hairline">
              <div
                ref={barRef}
                style={{ transform: "scaleX(0)" }}
                className="h-full w-full origin-left bg-gradient-to-r from-brand-500 via-ember-400 to-brand-600"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16">
          {heading}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PANELS.map((p) => (
              <PanelCard key={p.index} panel={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PanelCard({ panel }: { panel: Panel }) {
  return (
    <article
      className="gh-card group relative flex h-full min-h-[300px] flex-col overflow-hidden p-6 sm:p-7"
      style={{ ["--lg" as string]: panel.accent ?? "var(--color-brand-500)" }}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] opacity-70"
        style={{ background: "var(--lg)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: "var(--lg)" }}
      />
      <span
        className="text-outline font-display text-5xl font-bold leading-none"
        style={{ WebkitTextStrokeColor: "var(--lg)" }}
      >
        {panel.index}
      </span>
      <h3 className="mt-6 font-display text-2xl font-bold tracking-[-0.02em] text-ink-50 sm:text-[1.7rem]">
        {panel.title}
      </h3>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-ink-300">
        {panel.body}
      </p>
      <div className="mt-auto pt-6">{panel.visual}</div>
    </article>
  )
}

/* ── panel mini-visuals ───────────────────────────────────────── */
function LeaguesVisual() {
  const leagues = ["NBA", "EuroLeague", "ACB", "LEB Oro", "LEB Plata", "EBA"]
  return (
    <div className="flex flex-wrap gap-2">
      {leagues.map((l) => (
        <span
          key={l}
          className="rounded-full border border-hairline bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-300"
        >
          {l}
        </span>
      ))}
    </div>
  )
}

function NormalizeVisual() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className="rounded-xl border border-hairline bg-white/[0.02] p-3 font-mono text-[11px] text-ink-400">
        <p>34 MIN</p>
        <p>72 POSS</p>
        <p className="text-ink-500">raw</p>
      </div>
      <span className="font-display text-lg text-brand-400">→</span>
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/[0.06] p-3 font-mono text-[11px] text-brand-200">
        <p>per-40</p>
        <p>per-100</p>
        <p className="text-brand-300/70">one scale</p>
      </div>
    </div>
  )
}

function CompareVisual() {
  const rows = [
    { l: "PTS", a: 88, b: 60 },
    { l: "AST", a: 52, b: 84 },
    { l: "REB", a: 70, b: 76 },
  ]
  return (
    <div className="grid gap-2.5">
      {rows.map((r) => (
        <div key={r.l} className="flex items-center gap-3">
          <span className="w-8 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
            {r.l}
          </span>
          <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
            <span className="h-full rounded-l-full bg-brand-500/80" style={{ width: `${r.a / 2}%` }} />
            <span className="h-full rounded-r-full bg-accent-cyan/70" style={{ width: `${r.b / 2}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function AskVisual() {
  return (
    <div className="space-y-2">
      <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm border border-hairline bg-white/[0.04] px-3 py-2 text-[11px] text-ink-200">
        Who&apos;s the better playmaker?
      </div>
      <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm border border-accent-violet/30 bg-accent-violet/[0.08] px-3 py-2 text-[11px] text-ink-200">
        Higher AST% and lower TOV — the read is clear.
      </div>
    </div>
  )
}

function ExportVisual() {
  return (
    <div className="flex gap-2">
      {["PDF", "XLSX", "DOCX"].map((f) => (
        <span
          key={f}
          className="flex-1 rounded-xl border border-hairline bg-white/[0.02] px-3 py-3 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300"
        >
          {f}
        </span>
      ))}
    </div>
  )
}
