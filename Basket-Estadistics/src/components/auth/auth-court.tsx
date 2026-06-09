"use client"

import { useEffect, useRef } from "react"

export type AuthCourtStats = {
  leagues: number
  players: number
  teams: number
  coaches: number
}

type Props = {
  className?: string
  stats: AuthCourtStats
}

const LEAGUES = ["NBA", "EuroLeague", "ACB", "LEB Oro", "LEB Plata", "EBA"]

const FLIGHT = 1500
const DROP = 380
const PAUSE = 760
const CYCLE = FLIGHT + DROP + PAUSE

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

type Mote = { x: number; y: number; r: number; vy: number; alpha: number }

export function AuthCourt({ className, stats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number | null>(null)
  const motesRef = useRef<Mote[]>([])
  const shotRef = useRef({ start: 0, launchX: 0.5 })
  const pointerRef = useRef({ tx: 0, ty: 0, x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let height = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seedMotes()
      // Always paint a frame synchronously so the panel is never blank — the
      // rAF loop only animates on top of this. Matters for reduced-motion and
      // for environments that throttle requestAnimationFrame (background tabs).
      renderStatic()
    }

    const seedMotes = () => {
      const count = Math.round((width * height) / 26000)
      motesRef.current = Array.from({ length: Math.max(18, count) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.6,
        vy: 0.08 + Math.random() * 0.22,
        alpha: 0.15 + Math.random() * 0.4,
      }))
    }

    // ── Court geometry (recomputed per frame for responsiveness) ──────
    type Court = {
      cx: number
      baselineY: number
      rimX: number
      rimY: number
      rimR: number
      paintW: number
      ftY: number
      ftR: number
      arcR: number
      logoY: number
      logoR: number
    }
    const geom = (): Court => {
      const cx = width / 2
      const baselineY = height * 0.15
      return {
        cx,
        baselineY,
        rimX: cx,
        rimY: baselineY + Math.min(26, height * 0.04),
        rimR: Math.max(14, width * 0.028),
        paintW: width * 0.2,
        ftY: height * 0.44,
        ftR: width * 0.085,
        arcR: width * 0.36,
        logoY: height * 0.84,
        logoR: width * 0.07,
      }
    }

    const drawFloor = () => {
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.32,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85,
      )
      grad.addColorStop(0, "hsla(30, 55%, 16%, 0.55)")
      grad.addColorStop(0.45, "hsla(24, 45%, 10%, 0.55)")
      grad.addColorStop(1, "hsla(0, 0%, 3%, 0.96)")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    }

    const drawCourt = (c: Court) => {
      const line = "hsla(33, 82%, 60%, 0.22)"
      const faint = "hsla(33, 82%, 60%, 0.12)"
      ctx.lineWidth = 1.4
      ctx.strokeStyle = line

      // baseline
      ctx.beginPath()
      ctx.moveTo(width * 0.12, c.baselineY)
      ctx.lineTo(width * 0.88, c.baselineY)
      ctx.stroke()

      // paint / key
      ctx.strokeStyle = faint
      ctx.strokeRect(c.cx - c.paintW / 2, c.baselineY, c.paintW, c.ftY - c.baselineY)

      // free-throw circle
      ctx.strokeStyle = line
      ctx.beginPath()
      ctx.arc(c.cx, c.ftY, c.ftR, 0, Math.PI * 2)
      ctx.stroke()

      // three-point arc + corners
      ctx.beginPath()
      ctx.moveTo(width * 0.12, c.baselineY)
      ctx.lineTo(width * 0.12, c.rimY)
      ctx.arc(c.rimX, c.rimY, c.arcR, Math.PI, 0, true)
      ctx.lineTo(width * 0.88, c.baselineY)
      ctx.strokeStyle = faint
      ctx.stroke()

      // center logo ring near the bottom
      ctx.strokeStyle = line
      ctx.beginPath()
      ctx.arc(c.cx, c.logoY, c.logoR, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(c.cx, c.logoY, c.logoR * 0.42, 0, Math.PI * 2)
      ctx.strokeStyle = faint
      ctx.stroke()

      // backboard
      const bbW = c.paintW * 0.62
      ctx.strokeStyle = "hsla(33, 90%, 66%, 0.45)"
      ctx.lineWidth = 2.4
      ctx.beginPath()
      ctx.moveTo(c.rimX - bbW / 2, c.baselineY)
      ctx.lineTo(c.rimX + bbW / 2, c.baselineY)
      ctx.stroke()

      // rim
      ctx.lineWidth = 2.4
      ctx.strokeStyle = "hsla(20, 92%, 56%, 0.9)"
      ctx.beginPath()
      ctx.ellipse(c.rimX, c.rimY, c.rimR, c.rimR * 0.34, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    const drawNet = (c: Court, sway: number) => {
      const strands = 7
      const top = c.rimY + c.rimR * 0.2
      const bottom = c.rimY + c.rimR * 1.5
      ctx.strokeStyle = "hsla(0, 0%, 100%, 0.28)"
      ctx.lineWidth = 0.9
      for (let i = 0; i <= strands; i++) {
        const u = i / strands
        const x0 = c.rimX - c.rimR + u * c.rimR * 2
        const x1 = c.rimX + (x0 - c.rimX) * 0.42 + Math.sin(u * 6) * sway
        ctx.beginPath()
        ctx.moveTo(x0, top)
        ctx.quadraticCurveTo((x0 + x1) / 2, (top + bottom) / 2, x1, bottom)
        ctx.stroke()
      }
      // cross strands
      ctx.beginPath()
      ctx.moveTo(c.rimX - c.rimR * 0.7, (top + bottom) / 2)
      ctx.quadraticCurveTo(c.rimX, (top + bottom) / 2 + 4, c.rimX + c.rimR * 0.7, (top + bottom) / 2)
      ctx.stroke()
    }

    const drawBall = (
      x: number,
      y: number,
      r: number,
      angle: number,
      alpha: number,
    ) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(x, y)
      ctx.rotate(angle)

      const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r)
      g.addColorStop(0, "hsl(32, 96%, 64%)")
      g.addColorStop(0.6, "hsl(26, 90%, 52%)")
      g.addColorStop(1, "hsl(20, 85%, 40%)")
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()

      ctx.strokeStyle = "hsla(20, 60%, 20%, 0.85)"
      ctx.lineWidth = Math.max(1, r * 0.08)
      // outline
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.stroke()
      // vertical + horizontal seams
      ctx.beginPath()
      ctx.moveTo(0, -r)
      ctx.lineTo(0, r)
      ctx.moveTo(-r, 0)
      ctx.lineTo(r, 0)
      ctx.stroke()
      // curved side seams
      ctx.beginPath()
      ctx.ellipse(0, 0, r * 0.5, r, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    const drawSwish = (c: Court, p: number) => {
      const rr = c.rimR * (0.6 + p * 2.4)
      ctx.strokeStyle = `hsla(33, 95%, 65%, ${0.5 * (1 - p)})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(c.rimX, c.rimY, rr, rr * 0.34, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    const shotPos = (c: Court, progress: number) => {
      const lx = width * shotRef.current.launchX
      const ly = height * 0.74
      const x = lx + (c.rimX - lx) * progress
      const baseY = ly + (c.rimY - ly) * progress
      const peak = (ly - c.rimY) * 0.55 + height * 0.12
      const y = baseY - peak * 4 * progress * (1 - progress)
      return { x, y }
    }

    const newShot = (now: number) => {
      shotRef.current.start = now
      shotRef.current.launchX = 0.32 + Math.random() * 0.36
    }

    const renderScene = (now: number, animate: boolean) => {
      ctx.clearRect(0, 0, width, height)
      drawFloor()

      // pointer parallax (lerp toward target)
      const p = pointerRef.current
      p.x += (p.tx - p.x) * 0.06
      p.y += (p.ty - p.y) * 0.06
      const shiftX = p.x * 14
      const shiftY = p.y * 10

      ctx.save()
      ctx.translate(shiftX, shiftY)

      const c = geom()
      drawCourt(c)

      const r = Math.max(11, width * 0.022)
      // Static frame freezes the ball near the apex of its arc so the scene
      // reads as basketball even without animation.
      const elapsed = animate ? now - shotRef.current.start : FLIGHT * 0.42

      if (elapsed < FLIGHT) {
        const progress = easeInOut(Math.min(1, elapsed / FLIGHT))
        drawNet(c, 0)
        // trail
        for (let k = 6; k >= 1; k--) {
          const tp = Math.max(0, progress - k * 0.045)
          const { x, y } = shotPos(c, tp)
          drawBall(x, y, r * (1 - k * 0.05), now / 220 + k, 0.06 + (6 - k) * 0.02)
        }
        const { x, y } = shotPos(c, progress)
        drawBall(x, y, r, now / 220, 1)
      } else if (elapsed < FLIGHT + DROP) {
        const dp = (elapsed - FLIGHT) / DROP
        drawSwish(c, dp)
        drawNet(c, Math.sin(dp * Math.PI) * 6)
        const y = c.rimY + dp * height * 0.07
        drawBall(c.rimX, y, r, now / 220, 1 - dp * 0.5)
      } else {
        const fp = Math.min(1, (elapsed - FLIGHT - DROP) / 220)
        drawSwish(c, 1)
        drawNet(c, Math.sin((1 - fp) * Math.PI) * 4)
      }

      // ambient motes
      for (const m of motesRef.current) {
        if (animate) {
          m.y -= m.vy
          if (m.y < -4) {
            m.y = height + 4
            m.x = Math.random() * width
          }
        }
        ctx.beginPath()
        ctx.fillStyle = `hsla(33, 90%, 70%, ${m.alpha})`
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }

    const renderStatic = () => {
      pointerRef.current.x = 0
      pointerRef.current.y = 0
      renderScene(0, false)
    }

    const loop = (now: number) => {
      if (shotRef.current.start === 0) newShot(now)
      if (now - shotRef.current.start > CYCLE) newShot(now)
      renderScene(now, true)
      animRef.current = requestAnimationFrame(loop)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    if (!reduced) {
      animRef.current = requestAnimationFrame(loop)
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointerRef.current.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      pointerRef.current.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
    const onLeave = () => {
      pointerRef.current.tx = 0
      pointerRef.current.ty = 0
    }
    canvas.addEventListener("mousemove", onMove)
    canvas.addEventListener("mouseleave", onLeave)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      ro.disconnect()
      canvas.removeEventListener("mousemove", onMove)
      canvas.removeEventListener("mouseleave", onLeave)
    }
  }, [])

  const cards = [
    { label: "Leagues live", value: String(stats.leagues) },
    { label: "Players indexed", value: stats.players.toLocaleString("en-US") },
    { label: "Teams tracked", value: stats.teams.toLocaleString("en-US") },
    { label: "Coaches on file", value: stats.coaches.toLocaleString("en-US") },
  ]

  return (
    <div className={className}>
      <div className="relative h-full w-full overflow-hidden">
        <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-ink-950/40 via-transparent to-transparent"
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
            <div className="grid max-w-md grid-cols-2 gap-3">
              {cards.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-white/5 bg-ink-950/40 px-3 py-2 backdrop-blur-sm"
                >
                  <p className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink-100 sm:text-base">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex max-w-md flex-wrap items-center gap-x-2 gap-y-1">
              {LEAGUES.map((l, i) => (
                <span
                  key={l}
                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400"
                >
                  {i > 0 ? (
                    <span aria-hidden className="text-ink-600">
                      ·
                    </span>
                  ) : null}
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthCourt
