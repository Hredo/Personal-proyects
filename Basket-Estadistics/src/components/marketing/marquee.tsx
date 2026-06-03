import type { ReactNode } from "react"

type MarqueeProps = {
  children: ReactNode
  duration?: number
  reverse?: boolean
  className?: string
}

export function Marquee({
  children,
  duration = 40,
  reverse = false,
  className,
}: MarqueeProps) {
  return (
    <div
      className={`group overflow-hidden ${className ?? ""}`}
      style={
        {
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        } as React.CSSProperties
      }
    >
      <div
        className="flex w-max gap-10 py-2"
        style={
          {
            animation: `marquee ${duration}s linear infinite${reverse ? " reverse" : ""}`,
          } as React.CSSProperties
        }
      >
        <div className="flex shrink-0 items-center gap-10">{children}</div>
        <div className="flex shrink-0 items-center gap-10" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Marquee
