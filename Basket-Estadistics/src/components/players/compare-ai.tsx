"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type {
  CategoryResult,
  ComparisonOutput,
  Insight,
} from "@/lib/ai/player-comparator"

type Props = {
  aSlug: string
  bSlug: string
  aName: string
  bName: string
}

const INSIGHT_META: Record<
  Insight["kind"],
  { color: string; icon: string; label: string }
> = {
  edge: {
    color: "border-brand-500/40 bg-brand-500/5 text-brand-200",
    icon: "↑",
    label: "Edge",
  },
  strength: {
    color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-200",
    icon: "★",
    label: "Strength",
  },
  weakness: {
    color: "border-amber-500/40 bg-amber-500/5 text-amber-200",
    icon: "!",
    label: "Watch",
  },
  context: {
    color: "border-ink-700 bg-ink-800/40 text-ink-300",
    icon: "i",
    label: "Context",
  },
}

export function CompareAi({ aSlug, bSlug, aName, bName }: Props) {
  const [data, setData] = useState<ComparisonOutput | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastKeyRef = useRef<string | null>(null)

  const requestKey = `${aSlug}::${bSlug}`

  const fetchAnalysis = useCallback(async () => {
    if (!aSlug || !bSlug) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/compare/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aSlug, bSlug }),
      })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error ?? `Error ${res.status}`)
      }
      setData(payload.data as ComparisonOutput)
      lastKeyRef.current = requestKey
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.")
    } finally {
      setLoading(false)
    }
  }, [aSlug, bSlug, requestKey])

  useEffect(() => {
    if (lastKeyRef.current && lastKeyRef.current !== requestKey) {
      setData(null)
      setError(null)
    }
  }, [requestKey])

  return (
    <section className="rounded-2xl border border-white/5 bg-gradient-to-br from-brand-500/5 via-white/[0.02] to-accent-cyan/5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/30">
            <svg
              className="h-5 w-5 text-brand-300"
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
            <h2 className="font-display text-lg font-bold text-ink-50 sm:text-xl">
              AI analysis
            </h2>
            <p className="text-xs text-ink-300 sm:text-sm">
              The scout AI weighs every category, flags edges and drops a
              verdict in seconds.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchAnalysis}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
        >
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-950" />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-950"
                style={{ animationDelay: "120ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-950"
                style={{ animationDelay: "240ms" }}
              />
              <span className="ml-1">Analyzing…</span>
            </span>
          ) : data ? (
            "Re-run analysis"
          ) : (
            "Generate analysis"
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-200"
          >
            {error}
          </motion.div>
        ) : null}

        {loading && !data ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]"
              />
            ))}
          </motion.div>
        ) : null}

        {data && !loading ? (
          <motion.div
            key="data"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-5 space-y-5"
          >
            <ScoreCard data={data} aName={aName} bName={bName} />
            <Verdict data={data} />
            <Categories cats={data.categories} aName={aName} bName={bName} />
            <Insights insights={data.insights} aName={aName} bName={bName} />
            <FitNotes
              notes={data.fitNotes}
              archetype={data.archetype}
              aName={aName}
              bName={bName}
            />
            {data.warnings.length > 0 ? (
              <Warnings warnings={data.warnings} />
            ) : null}
          </motion.div>
        ) : null}

        {!data && !loading && !error ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-ink-400"
          >
            Hit <span className="text-brand-300">Generate analysis</span> and the
            local AI breaks the matchup down by category, flags edges and
            weaknesses, and lands a reasoned verdict.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </section>
  )
}

function ScoreCard({
  data,
  aName,
  bName,
}: {
  data: ComparisonOutput
  aName: string
  bName: string
}) {
  const { aScore, bScore, leader, confidence } = data.overall
  const total = aScore + bScore || 1
  const aPct = (aScore / total) * 100
  const leaderName =
    leader === "tie" ? "Tie" : leader === "a" ? aName : bName
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between text-[11px] font-mono uppercase tracking-widest">
        <span className="text-brand-300">{aName}</span>
        <span className="text-ink-500">AI score</span>
        <span className="text-accent-cyan">{bName}</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-white/5">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-400 to-brand-500"
          style={{ width: `${aPct}%`, transition: "width 700ms ease-out" }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-accent-cyan to-accent-cyan/70"
          style={{
            width: `${100 - aPct}%`,
            transition: "width 700ms ease-out",
          }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono text-ink-200">
          <span className="text-brand-300">{aScore.toFixed(1)}</span>{" "}
          <span className="text-ink-500">·</span>{" "}
          <span className="text-accent-cyan">{bScore.toFixed(1)}</span>{" "}
          <span className="text-ink-500">/ 6</span>
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-300">
          Confidence: {confidence}
        </span>
        <span className="font-semibold text-ink-100">
          {leader === "tie" ? "Dead heat" : `Leader: ${leaderName}`}
        </span>
      </div>
    </div>
  )
}

function Verdict({ data }: { data: ComparisonOutput }) {
  return (
    <div className="rounded-xl border-l-2 border-brand-500/60 bg-brand-500/5 px-4 py-3 text-sm leading-relaxed text-ink-100">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-brand-300">
        Verdict
      </p>
      {data.verdict}
    </div>
  )
}

function Categories({
  cats,
  aName,
  bName,
}: {
  cats: CategoryResult[]
  aName: string
  bName: string
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-400">
        Category breakdown
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cats.map((c) => {
          const winnerName =
            c.winner === "a"
              ? aName
              : c.winner === "b"
                ? bName
                : c.winner === "tie"
                  ? "Tie"
                  : "—"
          const winnerColor =
            c.winner === "a"
              ? "text-brand-300"
              : c.winner === "b"
                ? "text-accent-cyan"
                : "text-ink-400"
          return (
            <div
              key={c.key}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink-100">
                  <span aria-hidden>{c.emoji}</span> {c.label}
                </p>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wide ${winnerColor}`}
                >
                  {winnerName}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px] text-ink-200">
                <span className="rounded bg-white/[0.03] px-2 py-1">
                  <span className="text-brand-300">
                    {aName.split(" ").slice(-1)[0]}
                  </span>
                  : {c.formatted.a}
                </span>
                <span className="rounded bg-white/[0.03] px-2 py-1">
                  <span className="text-accent-cyan">
                    {bName.split(" ").slice(-1)[0]}
                  </span>
                  : {c.formatted.b}
                </span>
              </div>
              <p className="mt-2 text-xs text-ink-300">{c.summary}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Insights({
  insights,
  aName,
  bName,
}: {
  insights: Insight[]
  aName: string
  bName: string
}) {
  if (insights.length === 0) return null
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-400">
        Key takeaways
      </p>
      <ul className="space-y-2">
        {insights.map((i, idx) => {
          const meta = INSIGHT_META[i.kind]
          const subject =
            i.player === "a" ? aName : i.player === "b" ? bName : "Both"
          return (
            <li
              key={idx}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${meta.color}`}
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">
                {meta.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-70">
                  {meta.label} · {subject}
                </p>
                <p className="text-sm leading-relaxed">{i.text}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function FitNotes({
  notes,
  archetype,
  aName,
  bName,
}: {
  notes: string[]
  archetype: { a: string; b: string }
  aName: string
  bName: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-400">
        Archetype &amp; fit
      </p>
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-brand-300">
            {aName}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink-100">
            {archetype.a}
          </p>
        </div>
        <div className="rounded-lg border border-accent-cyan/30 bg-accent-cyan/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-accent-cyan">
            {bName}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink-100">
            {archetype.b}
          </p>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm text-ink-300">
        {notes.map((n, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 text-brand-400">›</span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Warnings({ warnings }: { warnings: string[] }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-amber-300">
        Before you trust it
      </p>
      <ul className="space-y-1">
        {warnings.map((w, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0">›</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CompareAi
