import Link from "next/link"
import { SmartImage } from "@/components/ui/smart-image"
import { getInitials } from "@/lib/format"

const ROLE_LABEL: Record<string, string> = {
  head_coach: "Head coach",
  assistant_coach: "Assistant coach",
  staff: "Staff",
}

const ROLE_BADGE: Record<string, string> = {
  head_coach: "bg-brand-500/15 text-brand-200 ring-brand-500/30",
  assistant_coach: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  staff: "bg-white/5 text-ink-200 ring-white/10",
}

const LEAGUE_ACCENT: Record<string, string> = {
  nba: "bg-brand-500/15 text-brand-200 ring-brand-500/30",
  euroleague: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  acb: "bg-amber-500/10 text-amber-200 ring-amber-500/30",
}

type Props = {
  coach: {
    id: string
    fullName: string
    slug: string
    role: "head_coach" | "assistant_coach" | "staff"
    nationality: string | null
    age: number | null
    photoUrl: string | null
    licenseType: string | null
    team: { id: string; name: string; slug: string; logoUrl: string | null }
    league: { id: string; name: string; slug: string; country: string }
  }
  index?: number
}

export function CoachCard({ coach, index = 0 }: Props) {
  return (
    <div
      className="group relative block overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-brand-500/40 hover:bg-white/[0.05] sm:p-4"
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-court-800 ring-1 ring-white/5 sm:h-16 sm:w-16">
          <SmartImage
            src={coach.photoUrl}
            alt={coach.fullName}
            fit="cover"
            className="transition duration-300 group-hover:scale-105"
            fallbackClassName="bg-gradient-to-br from-court-800 to-ink-900 text-xs font-bold text-brand-300 sm:text-sm"
            fallback={getInitials(coach.fullName)}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold text-ink-50 group-hover:text-brand-200 sm:text-base">
              {coach.fullName}
            </p>
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${
                ROLE_BADGE[coach.role] ?? ROLE_BADGE.staff
              }`}
            >
              {ROLE_LABEL[coach.role] ?? coach.role}
            </span>
          </div>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-ink-300 sm:text-xs">
            {coach.nationality ? <span>{coach.nationality}</span> : null}
            {coach.age != null ? <span>· {coach.age} y.o.</span> : null}
            {coach.licenseType ? <span>· License {coach.licenseType}</span> : null}
          </p>

          <p className="mt-0.5 truncate text-[11px] text-ink-400 sm:text-xs">
            {coach.team.name}
          </p>
        </div>

        <Link
          href={`/teams/${coach.league.slug}/${coach.team.slug}`}
          className="hidden h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-court-800 ring-1 ring-white/5 transition hover:ring-brand-500/40 sm:flex"
          title={`Open ${coach.team.name}`}
        >
          <SmartImage
            src={coach.team.logoUrl}
            alt={coach.team.name}
            fit="contain"
            className="p-1.5"
            fallbackClassName="text-[10px] font-bold text-brand-300"
            fallback={getInitials(coach.team.name, 2)}
          />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-2 font-mono">
        <div className="min-w-0">
          <p className="truncate text-[9px] uppercase tracking-wider text-ink-500 sm:text-[10px]">
            League
          </p>
          <p className="truncate text-[11px] font-semibold text-ink-100 sm:text-xs">
            <span
              className={`mr-1 inline rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${
                LEAGUE_ACCENT[coach.league.slug] ??
                "bg-white/5 text-ink-200 ring-white/10"
              }`}
            >
              {coach.league.name}
            </span>
          </p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[9px] uppercase tracking-wider text-ink-500 sm:text-[10px]">
            Team
          </p>
          <p className="truncate text-[11px] font-semibold text-ink-100 sm:text-xs">
            {coach.team.name}
          </p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[9px] uppercase tracking-wider text-ink-500 sm:text-[10px]">
            License
          </p>
          <p className="truncate text-[11px] font-semibold text-ink-100 sm:text-xs">
            {coach.licenseType ?? "—"}
          </p>
        </div>
      </div>
    </div>
  )
}
