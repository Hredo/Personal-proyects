import type { CSSProperties, ReactNode } from "react"

type FloatProps = {
  children: ReactNode
  duration?: number
  y?: number
  className?: string
  delay?: number
}

export function Float({ children, duration = 6, y = 12, delay = 0, className }: FloatProps) {
  const style: CSSProperties = {
    animation: `float ${duration}s ease-in-out ${delay}s infinite`,
    ["--float-amplitude" as string]: `${y}px`,
  }
  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

export default Float
