"use client"

import Link from "next/link"
import { SmartImage } from "@/components/ui/smart-image"
import { getInitials } from "@/lib/format"

const ROLE_LABEL: Record<string, string> = {
  head_coach: "Head coach",
  assistant_coach: "Assistant",
  staff: "Staff",
}

const ROLE_DOT: Record<string, string> = {
  head_coach: "bg-brand-400",
  assistant_coach: "bg-accent-cyan",
  staff: "bg-ink-400",
}

type Props = {
  coach: {
    id: string
    fullName: string
    slug: string
    role: "head_coach" | "assistant_coach" | "staff"
    photoUrl: string | null
    team: { id: string; name: string; slug: string; logoUrl: string | null }
    league: { id: string; name: string; slug: string; country: string }
  }
}

export function CoachCardElegant({ coach }: Props) {
  const initials = getInitials(coach.fullName)
  const label = ROLE_LABEL[coach.role] ?? coach.role
  const dot = ROLE_DOT[coach.role] ?? ROLE_DOT.staff

  return (
    <Link
      href={`/teams/${coach.league.slug}/${coach.team.slug}`}
      className="group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl bg-white/[0.02] p-3 ring-1 ring-transparent transition duration-150 hover:ring-brand-500/50 sm:p-4"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-court-900 sm:h-20 sm:w-20">
        <SmartImage
          src={coach.photoUrl}
          alt={coach.fullName}
          fit="cover"
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          fallbackClassName="bg-gradient-to-br from-court-800 to-ink-900 text-base font-bold text-brand-300 sm:text-lg"
          fallback={initials}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
          />
          <span className="font-mono text-[9px] uppercase tracking-widest text-ink-400">
            {label}
          </span>
        </div>
        <h3 className="mt-1 truncate font-display text-base font-semibold text-ink-50 sm:text-lg">
          {coach.fullName}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          {coach.team.logoUrl ? (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded bg-court-900 p-0.5 ring-1 ring-white/10">
              <SmartImage
                src={coach.team.logoUrl}
                alt={coach.team.name}
                fit="contain"
                fallbackClassName="text-[7px] font-bold text-brand-300"
                fallback={getInitials(coach.team.name, 2)}
              />
            </span>
          ) : null}
          <p className="truncate text-xs text-ink-300">{coach.team.name}</p>
        </div>
      </div>
    </Link>
  )
}
