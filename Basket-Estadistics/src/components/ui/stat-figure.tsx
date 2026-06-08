import type { ReactNode } from "react"
import { cn } from "@/components/ui/cn"

export function StatFigure({
  value,
  label,
  hint,
  accent,
  size = "md",
  className,
}: {
  value: ReactNode
  label: ReactNode
  hint?: ReactNode
  accent?: string
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const valueSize =
    size === "lg"
      ? "text-4xl sm:text-5xl"
      : size === "sm"
        ? "text-xl"
        : "text-2xl sm:text-3xl"
  return (
    <div className={cn("flex flex-col", className)}>
      <span
        className={cn("font-display font-bold leading-none nums", valueSize)}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
      <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400 sm:text-[11px]">
        {label}
      </span>
      {hint ? (
        <span className="mt-0.5 text-xs text-ink-500">{hint}</span>
      ) : null}
    </div>
  )
}
