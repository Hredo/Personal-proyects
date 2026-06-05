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
        transform: shown ? "translate3d(0,0,0)" : `translate3d(0,${y}px,0)`,
        transition: `opacity 0.6s cubic-bezier(0.21,0.47,0.32,0.98) ${delay}s, transform 0.6s cubic-bezier(0.21,0.47,0.32,0.98) ${delay}s`,
        willChange: shown ? "auto" : "opacity, transform",
      }

  return createElement(as, { ref, className, style }, children)
}

export default FadeIn
