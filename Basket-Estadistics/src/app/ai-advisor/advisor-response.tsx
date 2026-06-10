"use client"

import { motion } from "framer-motion"
import type { AdvisorOutput, Recruit } from "@/lib/ai/local-advisor"

const LEAGUE_COLORS: Record<string, string> = {
  NBA: "from-orange-500 to-red-500",
  EuroLeague: "from-blue-500 to-indigo-500",
  ACB: "from-red-500 to-yellow-500",
}

const LEAGUE_BG: Record<string, string> = {
  NBA: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  EuroLeague: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  ACB: "bg-red-500/10 text-red-300 border-red-500/30",
}

export function AdvisorResponse({ data }: { data: AdvisorOutput }) {
  return (
    <div className="space-y-4 w-full">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl border border-ink-700/50 bg-gradient-to-br from-ink-800/80 to-ink-900/80 p-4 backdrop-blur"
      >
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${LEAGUE_COLORS[data.team.leagueBadge] || "from-brand-500 to-brand-300"}`}
        />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{data.intentEmoji}</span>
              <span className="text-[10px] uppercase tracking-widest text-ink-400">
                Analysis for
              </span>
            </div>
            <h2 className="text-xl font-bold text-ink-50">{data.team.name}</h2>
          </div>
          <div
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${LEAGUE_BG[data.team.leagueBadge]}`}
          >
            {data.team.leagueBadge}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-300">
          <span className="rounded-md bg-ink-700/40 px-2 py-1">
            <span className="text-ink-500">Roster</span> ·{" "}
            <span className="font-mono font-semibold text-ink-100">
              {data.team.rosterSize} players
            </span>
          </span>
        </div>
      </motion.div>

      {/* Team analysis */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-xl border border-ink-700/40 bg-ink-800/40 p-4"
      >
        <div className="mb-2 flex items-center gap-2">
          <svg
            className="h-4 w-4 text-brand-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-ink-100">
            Team diagnosis
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-ink-300">{data.analysis}</p>
        <div className="mt-3 rounded-lg border-l-2 border-brand-500/60 bg-brand-500/5 px-3 py-2 text-xs text-ink-200">
          <span className="font-semibold text-brand-300">
            Detected gap:{" "}
          </span>
          {data.gap}
        </div>
        {data.team.topPlayers.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-ink-500">Current core:</span>
            {data.team.topPlayers.map((p) => (
              <span
                key={p}
                className="rounded-md bg-ink-700/30 px-1.5 py-0.5 text-ink-300"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recommendations */}
      <div className="space-y-2">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-2 px-1"
        >
          <svg
            className="h-4 w-4 text-brand-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-ink-100">
            Recommended candidates
          </h3>
        </motion.div>

        {data.recommendations.map((rec, i) => (
          <RecruitCard key={`${rec.name}-${i}`} rec={rec} index={i} />
        ))}
      </div>

      {/* Considerations */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="rounded-xl border border-ink-700/40 bg-ink-800/30 p-4"
      >
        <div className="mb-2 flex items-center gap-2">
          <svg
            className="h-4 w-4 text-ink-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-ink-200">
            Before you negotiate
          </h3>
        </div>
        <ul className="space-y-1.5 text-xs text-ink-300">
          {data.considerations.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand-400 shrink-0">›</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}

function RecruitCard({
  rec,
  index,
}: {
  rec: Recruit & { priority: string; priorityColor: string }
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 + index * 0.08 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-xl border border-ink-700/50 bg-gradient-to-br from-ink-800/70 to-ink-900/70 p-4 backdrop-blur transition-colors hover:border-brand-500/40"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-400 to-brand-600" />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-ink-500">
              #{index + 1}
            </span>
            <h4 className="text-base font-bold text-ink-50">{rec.name}</h4>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${LEAGUE_BG[rec.league] || "bg-ink-700/40 text-ink-300 border-ink-600"}`}
            >
              {rec.league}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
            <span>{rec.position}</span>
            <span className="text-ink-600">·</span>
            <span>{rec.age} y/o</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-sm font-bold text-ink-100">
            {rec.contractValue}
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-500">
            {rec.market}
          </div>
        </div>
      </div>

      <div className="mt-3 pl-2">
        <div
          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rec.priorityColor}`}
        >
          {rec.priority}
        </div>
      </div>

      <div className="mt-3 pl-2">
        <p className="text-sm leading-relaxed text-ink-200">
          <span className="text-brand-300 font-semibold">Fit: </span>
          {rec.fit}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 pl-2">
        {rec.strengths.map((s) => (
          <span
            key={s}
            className="rounded-md bg-ink-700/30 px-2 py-0.5 text-[11px] text-ink-300"
          >
            {s}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
