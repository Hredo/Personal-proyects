"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  className?: string
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hue: number
  alpha: number
}

const ACCENT = [
  "hsla(33, 90%, 60%, 0.9)",
  "hsla(220, 80%, 65%, 0.85)",
  "hsla(340, 80%, 65%, 0.85)",
  "hsla(130, 70%, 60%, 0.8)",
]

const STATS = [
  { label: "Live players", value: "2,400+" },
  { label: "Leagues tracked", value: "3" },
  { label: "Avg. query time", value: "0.4s" },
  { label: "Trusted by", value: "scouts, fans & teams" },
]

const COURT_LINES = [
  { x: 0, y: 0, w: 1, h: 0.04, kind: "border" as const },
  { x: 0.5, y: 0, w: 0.005, h: 0.5, kind: "line" as const },
  { x: 0, y: 0.5, w: 1, h: 0.005, kind: "line" as const },
  { x: 0.18, y: 0, w: 0.005, h: 0.18, kind: "line" as const },
  { x: 0.18, y: 0.18, w: 0.13, h: 0.005, kind: "line" as const },
  { x: 0.82, y: 0, w: 0.005, h: 0.18, kind: "line" as const },
  { x: 0.69, y: 0.18, w: 0.13, h: 0.005, kind: "line" as const },
  { x: 0, y: 0.32, w: 0.18, h: 0.005, kind: "arc-top" as const },
  { x: 0.82, y: 0.32, w: 0.18, h: 0.005, kind: "arc-top" as const },
  { x: 0, y: 0.5, w: 0.005, h: 0.18, kind: "line" as const },
  { x: 0.995, y: 0.5, w: 0.005, h: 0.18, kind: "line" as const },
  { x: 0, y: 0.68, w: 0.18, h: 0.005, kind: "arc-bot" as const },
  { x: 0.82, y: 0.68, w: 0.18, h: 0.005, kind: "arc-bot" as const },
  { x: 0.5, y: 0.92, w: 0.005, h: 0.08, kind: "line" as const },
  { x: 0.42, y: 0.95, w: 0.16, h: 0.005, kind: "line" as const },
  { x: 0.42, y: 0.99, w: 0.16, h: 0.005, kind: "line" as const },
]

export function AuthCourt({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  })
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let height = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const seed = (count: number) => {
      particlesRef.current = Array.from({ length: count }, () => {
        const r = 1 + Math.random() * 2.4
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r,
          hue: Math.floor(Math.random() * ACCENT.length),
          alpha: 0.35 + Math.random() * 0.55,
        }
      })
    }
    seed(70)

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)

      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75,
      )
      grad.addColorStop(0, "hsla(33, 70%, 18%, 0.6)")
      grad.addColorStop(0.4, "hsla(220, 50%, 14%, 0.5)")
      grad.addColorStop(1, "hsla(0, 0%, 4%, 0.95)")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      ctx.save()
      ctx.translate(width * 0.06, height * 0.08)
      const cw = width * 0.88
      const ch = height * 0.84
      ctx.lineWidth = 1
      ctx.strokeStyle = "hsla(33, 80%, 60%, 0.18)"
      for (const ln of COURT_LINES) {
        const x = ln.x * cw
        const y = ln.y * ch
        const w = ln.w * cw
        const h = ln.h * ch
        ctx.beginPath()
        if (ln.kind === "arc-top") {
          ctx.arc(x + w, y + h, w, 0, Math.PI, false)
        } else if (ln.kind === "arc-bot") {
          ctx.arc(x + w, y, w, 0, Math.PI, true)
        } else {
          ctx.rect(x, y, w, h)
        }
        ctx.stroke()
      }
      const cx = cw / 2
      const cy = ch / 2
      const cr = Math.min(cw, ch) * 0.12
      ctx.beginPath()
      ctx.arc(cx, cy, cr, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = "hsla(33, 90%, 65%, 0.6)"
      ctx.fill()
      ctx.restore()

      const pulse = 0.5 + 0.5 * Math.sin(t / 1400)
      const ringR = 60 + pulse * 30
      ctx.beginPath()
      ctx.arc(width * 0.78, height * 0.22, ringR, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(33, 90%, 60%, ${0.18 + pulse * 0.18})`
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(width * 0.78, height * 0.22, 6 + pulse * 3, 0, Math.PI * 2)
      ctx.fillStyle = "hsla(33, 90%, 65%, 0.85)"
      ctx.fill()

      const px = pointerRef.current.x
      const py = pointerRef.current.y
      const pa = pointerRef.current.active

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        if (pa) {
          const dx = p.x - px
          const dy = p.y - py
          const d2 = dx * dx + dy * dy
          if (d2 < 120 * 120) {
            const f = (1 - Math.sqrt(d2) / 120) * 0.6
            p.x += (dx / Math.sqrt(d2 || 1)) * f * 1.2
            p.y += (dy / Math.sqrt(d2 || 1)) * f * 1.2
          }
        }

        ctx.beginPath()
        ctx.fillStyle = ACCENT[p.hue % ACCENT.length]
        ctx.globalAlpha = p.alpha
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      if (pa) {
        const grad2 = ctx.createRadialGradient(px, py, 0, px, py, 130)
        grad2.addColorStop(0, "hsla(33, 100%, 70%, 0.45)")
        grad2.addColorStop(1, "hsla(33, 100%, 70%, 0)")
        ctx.fillStyle = grad2
        ctx.fillRect(px - 130, py - 130, 260, 260)
      }

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i]
          const b = particlesRef.current[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < 90 * 90) {
            const alpha = (1 - Math.sqrt(d2) / 90) * 0.18
            ctx.beginPath()
            ctx.strokeStyle = `hsla(33, 90%, 60%, ${alpha})`
            ctx.lineWidth = 0.7
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const point =
        "touches" in e && e.touches.length > 0
          ? e.touches[0]
          : (e as MouseEvent)
      pointerRef.current.x = point.clientX - rect.left
      pointerRef.current.y = point.clientY - rect.top
      pointerRef.current.active = true
    }
    const handleLeave = () => {
      pointerRef.current.active = false
    }
    canvas.addEventListener("mousemove", handleMove)
    canvas.addEventListener("touchmove", handleMove, { passive: true })
    canvas.addEventListener("mouseleave", handleLeave)
    canvas.addEventListener("touchend", handleLeave)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      ro.disconnect()
      canvas.removeEventListener("mousemove", handleMove)
      canvas.removeEventListener("touchmove", handleMove)
      canvas.removeEventListener("mouseleave", handleLeave)
      canvas.removeEventListener("touchend", handleLeave)
    }
  }, [])

  return (
    <div
      className={className}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="relative h-full w-full overflow-hidden">
        <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-ink-950/30 via-transparent to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-court-grid opacity-30 mix-blend-overlay"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-8 sm:p-12">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-brand-300/80">
              globalhoopstats
            </p>
            <h2 className="mt-3 max-w-md font-display text-2xl font-bold text-ink-50 sm:text-3xl lg:text-4xl">
              Hoops, decoded.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-300 sm:text-base">
              Sign in to keep your advisor conversations, run unlimited AI
              comparisons and unlock the full scouting toolkit.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-white/5 bg-ink-950/40 px-3 py-2 backdrop-blur-sm"
                >
                  <p className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-ink-100 sm:text-base">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            <p
              className={`max-w-sm text-[11px] text-ink-400 transition-opacity ${
                hovering ? "opacity-100" : "opacity-60"
              }`}
            >
              Move your cursor over the court to interact with the data grid.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthCourt
