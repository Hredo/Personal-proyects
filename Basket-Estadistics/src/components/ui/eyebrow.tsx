import type { ReactNode } from "react"
import { cn } from "@/components/ui/cn"

export function Eyebrow({
  children,
  className,
  tone = "brand",
}: {
  children: ReactNode
  className?: string
  tone?: "brand" | "muted"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em]",
        tone === "brand" ? "text-brand-300" : "text-ink-400",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-px w-6",
          tone === "brand"
            ? "bg-gradient-to-r from-brand-400 to-transparent"
            : "bg-gradient-to-r from-ink-500 to-transparent",
        )}
      />
      {children}
    </span>
  )
}
