"use client"

import { useState } from "react"
import { PlayerCard } from "@/components/players/player-card"
import type { RosterPlayer } from "@/lib/data/teams"

const INITIAL_VISIBLE = 16
// Below this many hidden players, collapsing isn't worth the extra click.
const MIN_HIDDEN = 4

type Props = { players: RosterPlayer[] }

export function TeamRosterGrid({ players }: Props) {
  const collapsible = players.length >= INITIAL_VISIBLE + MIN_HIDDEN
  const [expanded, setExpanded] = useState(!collapsible)

  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-ink-300">
        No players found for this team in the current season.
      </div>
    )
  }

  const visible = expanded ? players : players.slice(0, INITIAL_VISIBLE)

  return (
    <>
      <ul className="team-roster-grid grid grid-cols-1 gap-3 md:grid-cols-2">
        {visible.map((p, idx) => (
          <li
            key={p.id}
            className="team-roster-card relative overflow-hidden rounded-xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1"
              style={{
                background:
                  "linear-gradient(180deg, var(--team-400), var(--team-600))",
              }}
            />
            <PlayerCard player={p} index={idx} />
          </li>
        ))}
      </ul>
      {!expanded ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-ink-100 transition hover:border-brand-400/40 hover:text-ink-50"
          >
            Show all {players.length} players
            <svg
              aria-hidden
              className="h-3.5 w-3.5 transition group-hover:translate-y-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        </div>
      ) : null}
    </>
  )
}
