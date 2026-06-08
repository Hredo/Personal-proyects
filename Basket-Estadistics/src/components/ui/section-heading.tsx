import type { ReactNode } from "react"
import { cn } from "@/components/ui/cn"
import { Eyebrow } from "@/components/ui/eyebrow"

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  titleClassName,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  align?: "left" | "center"
  className?: string
  titleClassName?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "mx-auto max-w-2xl items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          "font-display font-semibold leading-[0.98] tracking-[-0.03em] text-ink-50 text-balance text-3xl sm:text-4xl md:text-[3.25rem]",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-pretty text-base leading-relaxed text-ink-300 sm:text-lg",
            align === "center" ? "max-w-xl" : "max-w-2xl",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
