import { PlayerCard } from "@/components/players/player-card"
import type { PlayerListItem } from "@/lib/data/players"

type Props = { players: PlayerListItem[] }

export function TeamRosterGrid({ players }: Props) {
  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-ink-300">
        No players found for this team in the current season.
      </div>
    )
  }
  return (
    <ul className="team-roster-grid grid grid-cols-1 gap-3 md:grid-cols-2">
      {players.map((p, idx) => (
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
  )
}
