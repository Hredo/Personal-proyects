import Link from "next/link"

type Props = {
  team: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    country: string | null
    league: { id: string; name: string; slug: string; country: string }
    playerCount: number
  }
  index?: number
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 3)
    .join("")
    .toUpperCase()
}

export function TeamCard({ team, index = 0 }: Props) {
  const initials = getInitials(team.name)

  return (
    <Link
      href={`/players?team=${encodeURIComponent(team.name)}`}
      className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-brand-500/40 hover:bg-white/[0.05]"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-court-800 ring-1 ring-white/5">
        {team.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logoUrl}
            alt={team.name}
            className="h-full w-full object-contain p-1 transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-brand-300">
            {initials}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink-50">{team.name}</p>
        <p className="mt-0.5 truncate text-xs text-ink-300">
          {team.league.name}
          {team.country ? ` · ${team.country}` : null}
        </p>
      </div>
      <div className="text-right font-mono text-sm">
        <p className="text-[10px] uppercase tracking-wider text-ink-400">
          Roster
        </p>
        <p className="font-semibold text-brand-300">{team.playerCount}</p>
      </div>
    </Link>
  )
}
