import { TeamLogoHero } from "@/components/teams/team-logo-hero"

type Props = {
  name: string
  shortName: string | null
  logoUrl: string | null
  league: { name: string; slug: string; country: string }
  city: string | null
  country: string | null
  foundedYear: number | null
  arena: string | null
  arenaCapacity: number | null
  websiteUrl: string | null
}

export function TeamHero({
  name,
  shortName,
  logoUrl,
  league,
  city,
  country,
  foundedYear,
  arena,
  arenaCapacity,
  websiteUrl,
}: Props) {
  const location = [city, country].filter(Boolean).join(", ") || null
  return (
    <section
      className="team-hero relative overflow-hidden rounded-3xl border border-white/5 px-6 py-10 sm:px-10 sm:py-14"
      style={{
        background:
          "radial-gradient(ellipse at top left, color-mix(in oklch, var(--team-500) 18%, transparent), transparent 55%), radial-gradient(ellipse at bottom right, color-mix(in oklch, var(--team-700) 22%, transparent), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--team-400), transparent)",
        }}
      />
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(260px,360px)_1fr]">
        <TeamLogoHero src={logoUrl} name={name} shortName={shortName} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--team-300)]">
            <span>{league.name}</span>
            {location ? (
              <>
                <span className="text-ink-500">·</span>
                <span className="text-ink-300">{location}</span>
              </>
            ) : null}
            {foundedYear ? (
              <>
                <span className="text-ink-500">·</span>
                <span className="text-ink-300">Founded {foundedYear}</span>
              </>
            ) : null}
          </div>
          <h1
            className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl"
            style={{
              background:
                "linear-gradient(120deg, var(--team-200), var(--team-400) 45%, var(--team-600))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {name}
          </h1>
          {arena ? (
            <p className="mt-3 text-sm text-ink-200">
              <span className="text-ink-400">Home:</span>{" "}
              <span className="font-semibold text-ink-100">{arena}</span>
              {arenaCapacity ? (
                <span className="text-ink-400">
                  {" "}
                  · {arenaCapacity.toLocaleString("en-US")} seats
                </span>
              ) : null}
            </p>
          ) : null}
          {websiteUrl ? (
            <p className="mt-1 text-sm">
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--team-300)] transition hover:text-[var(--team-200)]"
              >
                {websiteUrl.replace(/^https?:\/\//, "")} ↗
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
