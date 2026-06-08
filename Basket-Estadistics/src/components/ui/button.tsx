import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/components/ui/cn"

type Variant = "primary" | "secondary" | "ghost"
type Size = "sm" | "md" | "lg"

const BASE =
  "group/btn gh-sheen relative inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-300 ease-swift active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-ink-950 shadow-[var(--shadow-brand-glow)] hover:bg-brand-400 hover:shadow-[var(--shadow-brand-glow-lg)]",
  secondary:
    "border border-hairline bg-white/[0.04] text-ink-50 hover:border-hairline-strong hover:bg-white/[0.07]",
  ghost: "text-ink-200 hover:text-ink-50 hover:bg-white/[0.04]",
}

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm sm:text-[15px]",
  lg: "h-12 px-6 text-[15px] sm:text-base",
}

const ICON_WRAP: Record<Size, string> = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 transition-transform duration-300 ease-fluid group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
      aria-hidden
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

type CommonProps = {
  variant?: Variant
  size?: Size
  arrow?: boolean
  children: ReactNode
  className?: string
}

function Inner({
  children,
  arrow,
  size,
  variant,
}: {
  children: ReactNode
  arrow?: boolean
  size: Size
  variant: Variant
}) {
  return (
    <>
      {children}
      {arrow ? (
        <span
          className={cn(
            "flex items-center justify-center rounded-full transition-all duration-300 ease-swift group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-px group-hover/btn:scale-105",
            ICON_WRAP[size],
            variant === "primary" ? "bg-ink-950/15" : "bg-white/[0.08]",
          )}
        >
          <Arrow />
        </span>
      ) : null}
    </>
  )
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...rest
}: CommonProps & { href: string } & Omit<
    ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >) {
  return (
    <Link
      href={href}
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        arrow && "pr-2",
        className,
      )}
      {...rest}
    >
      <Inner arrow={arrow} size={size} variant={variant}>
        {children}
      </Inner>
    </Link>
  )
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        arrow && "pr-2",
        className,
      )}
      {...rest}
    >
      <Inner arrow={arrow} size={size} variant={variant}>
        {children}
      </Inner>
    </button>
  )
}
