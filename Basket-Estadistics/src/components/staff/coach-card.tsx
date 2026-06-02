import Link from "next/link"

type CoachTeam = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
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
    team: CoachTeam
  }
}

const ROLE_LABEL: Record<Props["coach"]["role"], string> = {
  head_coach: "Head coach",
  assistant_coach: "Assistant",
  staff: "Staff",
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function CoachCard({ coach }: Props) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition hover:border-brand-500/40 hover:bg-white/[0.05]">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-court-800 ring-1 ring-white/5">
        {coach.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coach.photoUrl}
            alt={coach.fullName}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-brand-300">
            {getInitials(coach.fullName)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-50">
          {coach.fullName}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-300">
          <span className="font-medium text-brand-300">
            {ROLE_LABEL[coach.role]}
          </span>
          {coach.nationality ? <span>· {coach.nationality}</span> : null}
          {coach.age != null ? <span>· {coach.age} yrs</span> : null}
        </p>
      </div>
      <Link
        href={`/players?team=${encodeURIComponent(coach.team.name)}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-court-800 ring-1 ring-white/5 transition hover:ring-brand-500/40"
        title={coach.team.name}
      >
        {coach.team.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coach.team.logoUrl}
            alt={coach.team.name}
            className="h-full w-full object-contain p-1"
            loading="lazy"
          />
        ) : (
          <span className="text-[10px] font-bold text-brand-300">
            {getInitials(coach.team.name)}
          </span>
        )}
      </Link>
    </div>
  )
}
