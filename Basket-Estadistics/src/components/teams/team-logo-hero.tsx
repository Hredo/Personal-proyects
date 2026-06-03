import { SmartImage } from "@/components/ui/smart-image"

type Props = {
  src: string | null | undefined
  name: string
  shortName: string | null
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

export function TeamLogoHero({ src, name, shortName }: Props) {
  const fallback = shortName?.slice(0, 3).toUpperCase() || getInitials(name)
  return (
    <div className="team-logo-hero relative isolate flex items-center justify-center">
      <div
        aria-hidden
        className="team-logo-hero__halo pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--team-glow), transparent 65%)",
        }}
      />
      <div
        className="team-logo-hero__plate relative flex aspect-square w-full max-w-[360px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 shadow-[var(--shadow-court)]"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, var(--team-500), transparent 60%)",
          }}
        />
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <SmartImage
            src={src}
            alt={name}
            fit="contain"
            eager
            className="team-logo-hero__img"
            fallbackClassName="font-display text-5xl font-bold text-[var(--team-300)]"
            fallback={fallback}
          />
        </div>
      </div>
    </div>
  )
}
