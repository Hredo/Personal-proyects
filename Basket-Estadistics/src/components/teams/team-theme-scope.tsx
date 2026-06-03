"use client"

import type { CSSProperties, ReactNode } from "react"
import { type TeamPalette, paletteToCss } from "@/lib/theme/team-color"

type Props = {
  palette: TeamPalette | null
  children: ReactNode
}

export function TeamThemeScope({ palette, children }: Props) {
  const style: CSSProperties & Record<string, string> = palette
    ? (paletteToCss(palette) as CSSProperties & Record<string, string>)
    : {}
  return (
    <div
      data-team-theme={palette ? palette.source : "none"}
      style={style}
      className="team-theme-scope"
    >
      {children}
    </div>
  )
}
