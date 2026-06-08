"use client"

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

type FadeInProps = {
  children: ReactNode
  delay?: number
  y?: number
  /** horizontal entry offset (px) */
  x?: number
  /** apply a blur-up on entry for a heavier, premium feel */
  blur?: boolean
  className?: string
  as?:
    | "div"
    | "section"
    | "article"
    | "li"
    | "header"
    | "footer"
    | "ul"
    | "span"
}

export function FadeIn({
  children,
  delay = 0,
  y = 24,
  x = 0,
  blur = true,
  className,
  as = "div",
}: FadeInProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduce(mq.matches)
    if (mq.matches) {
      setShown(true)
      return
    }
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const inView = rect.top < window.innerHeight && rect.bottom > 0
    if (inView) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const style: CSSProperties = reduce
    ? {}
    : {
        opacity: shown ? 1 : 0,
        transform: shown
          ? "translate3d(0,0,0)"
          : `translate3d(${x}px,${y}px,0)`,
        filter: blur ? (shown ? "blur(0px)" : "blur(8px)") : undefined,
        transition: `opacity 0.7s var(--ease-out-expo) ${delay}s, transform 0.8s var(--ease-out-expo) ${delay}s, filter 0.7s var(--ease-out-expo) ${delay}s`,
        willChange: shown ? "auto" : "opacity, transform, filter",
      }

  return createElement(as, { ref, className, style }, children)
}

export default FadeIn
