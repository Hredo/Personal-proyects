import type { ReactNode } from "react"
import { Reveal } from "@/components/animations/reveal"
import { Eyebrow } from "@/components/ui/eyebrow"
import { StatFigure } from "@/components/ui/stat-figure"

type Stat = { value: ReactNode; label: ReactNode }

export function DirectoryHero({
  eyebrow,
  title,
  description,
  stats,
}: {
  eyebrow: ReactNode
  title: ReactNode
  description: ReactNode
  stats?: Stat[]
}) {
  return (
    <header className="relative isolate overflow-hidden pb-2 pt-10 sm:pt-14">
      <div
        aria-hidden
        className="absolute -top-28 left-[-6%] -z-10 h-72 w-[640px] animate-aurora rounded-full bg-brand-500/12 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 -top-10 -z-10 h-72 bg-dot-field opacity-50"
      />
      <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-4 font-display text-6xl font-bold leading-[0.84] tracking-[-0.045em] text-ink-50 sm:text-7xl md:text-8xl">
              {title}
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-5 max-w-md text-pretty text-sm leading-relaxed text-ink-300 sm:text-base">
              {description}
            </p>
          </Reveal>
        </div>
        {stats && stats.length > 0 ? (
          <Reveal delay={0.16} direction="left">
            <div className="flex shrink-0 items-end gap-8 hairline-t pt-5 md:border-t-0 md:pt-0">
              {stats.map((s, i) => (
                <StatFigure key={i} value={s.value} label={s.label} size="lg" />
              ))}
            </div>
          </Reveal>
        ) : null}
      </div>
    </header>
  )
}
