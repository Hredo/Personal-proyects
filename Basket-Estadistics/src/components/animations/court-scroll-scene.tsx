"use client"

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion"
import { useEffect, useRef } from "react"

/* ── palette (canvas-safe rgba) ───────────────────────────────── */
const BRAND = (a: number) => `rgba(255, 142, 58, ${a})`
const EMBER = (a: number) => `rgba(255, 104, 48, ${a})`
const CYAN = (a: number) => `rgba(86, 201, 255, ${a})`
const LINE = (a: number) => `rgba(255, 255, 255, ${a})`

/* deterministic pseudo-random so the scene scrubs identically both ways */
function rand(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = (t: number) => 1 - Math.pow(1 - t, 3)

type Pt = { x: number; y: number }
function arcAt(t: number, a: Pt, c: Pt, b: Pt): Pt {
  const u = 1 - t
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  }
}

const PARTICLES = 46

function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: number,
) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2
  const rim: Pt = { x: cx + w * 0.02, y: h * 0.2 }
  const release: Pt = { x: cx - w * 0.3, y: h * 0.82 }
  const control: Pt = { x: cx - w * 0.16, y: h * -0.04 }

  /* ── background slow-rotating depth ring ─────────────────────── */
  ctx.save()
  ctx.translate(rim.x, rim.y + h * 0.16)
  ctx.rotate(p * 0.6)
  ctx.strokeStyle = LINE(0.05)
  ctx.lineWidth = 1
  for (let r = 1; r <= 3; r++) {
    ctx.beginPath()
    ctx.ellipse(0, 0, w * 0.13 * r, w * 0.05 * r, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  /* ── court floor: perspective lines converging at the hoop ───── */
  const drawIn = clamp(p / 0.26)
  const vp: Pt = { x: rim.x, y: rim.y + h * 0.06 }
  ctx.lineWidth = 1
  const spread = 7
  for (let i = -spread; i <= spread; i++) {
    const lt = clamp((drawIn - Math.abs(i) / (spread * 2)) * 1.6)
    if (lt <= 0) continue
    const baseX = cx + (i / spread) * w * 0.62
    const baseY = h * 1.02
    ctx.strokeStyle = LINE(0.06 * lt)
    ctx.beginPath()
    ctx.moveTo(baseX, baseY)
    ctx.lineTo(vp.x + (baseX - vp.x) * (1 - lt * 0.0), vp.y + (baseY - vp.y) * (1 - lt))
    ctx.stroke()
  }
  /* horizontal rungs (closer together toward the hoop) */
  for (let r = 1; r <= 8; r++) {
    const f = r / 9
    const ry = vp.y + (h * 1.02 - vp.y) * Math.pow(f, 1.7)
    const rw = w * 0.62 * Math.pow(f, 1.5)
    const lt = clamp((drawIn - f * 0.4) * 1.8)
    if (lt <= 0) continue
    ctx.strokeStyle = LINE(0.05 * lt)
    ctx.beginPath()
    ctx.moveTo(cx - rw, ry)
    ctx.lineTo(cx + rw, ry)
    ctx.stroke()
  }

  /* ── three-point arc on the floor ────────────────────────────── */
  const arcT = clamp((p - 0.06) / 0.22)
  if (arcT > 0) {
    ctx.strokeStyle = BRAND(0.32 * arcT)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(
      rim.x,
      rim.y + h * 0.12,
      w * 0.34,
      h * 0.12,
      0,
      Math.PI * (1 - arcT),
      Math.PI * 2 * 1,
    )
    ctx.stroke()
  }

  /* ── backboard + rim + net ───────────────────────────────────── */
  const hoopT = clamp((p - 0.12) / 0.16)
  if (hoopT > 0) {
    ctx.globalAlpha = hoopT
    // backboard
    ctx.strokeStyle = LINE(0.22)
    ctx.lineWidth = 2
    const bw = w * 0.13
    const bh = h * 0.09
    ctx.strokeRect(rim.x - bw / 2, rim.y - bh - h * 0.02, bw, bh)
    ctx.strokeStyle = BRAND(0.4)
    ctx.strokeRect(rim.x - bw * 0.18, rim.y - bh * 0.62 - h * 0.02, bw * 0.36, bh * 0.42)
    // rim
    ctx.strokeStyle = EMBER(0.95)
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(rim.x, rim.y, w * 0.05, h * 0.014, 0, 0, Math.PI * 2)
    ctx.stroke()
    // net
    ctx.strokeStyle = LINE(0.3)
    ctx.lineWidth = 1
    const netH = h * 0.07
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const topx = rim.x + Math.cos(a) * w * 0.05
      const topy = rim.y + Math.sin(a) * h * 0.014
      ctx.beginPath()
      ctx.moveTo(topx, topy)
      ctx.lineTo(rim.x + (topx - rim.x) * 0.35, rim.y + netH)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  /* ── ball flight along the arc ───────────────────────────────── */
  const flight = clamp((p - 0.12) / 0.56)
  const t = ease(flight)
  const pos = arcAt(t, release, control, rim)
  const baseR = w * 0.052
  const ballR = baseR * (1 - t * 0.42)

  // comet trail
  for (let k = 1; k <= 10; k++) {
    const tt = clamp(t - k * 0.016)
    if (tt <= 0) break
    const tp = arcAt(tt, release, control, rim)
    const tr = baseR * (1 - tt * 0.42) * (1 - k / 12)
    ctx.fillStyle = BRAND(0.06 * (1 - k / 11))
    ctx.beginPath()
    ctx.arc(tp.x, tp.y, tr, 0, Math.PI * 2)
    ctx.fill()
  }

  // ball glow
  const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, ballR * 3.4)
  g.addColorStop(0, BRAND(0.5))
  g.addColorStop(1, BRAND(0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, ballR * 3.4, 0, Math.PI * 2)
  ctx.fill()

  if (flight < 1.001) {
    // ball body
    const bg = ctx.createRadialGradient(
      pos.x - ballR * 0.35,
      pos.y - ballR * 0.4,
      ballR * 0.1,
      pos.x,
      pos.y,
      ballR,
    )
    bg.addColorStop(0, "rgba(255, 168, 92, 1)")
    bg.addColorStop(1, "rgba(196, 78, 24, 1)")
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, ballR, 0, Math.PI * 2)
    ctx.fill()

    // seams (rotating)
    const rot = t * Math.PI * 4
    ctx.save()
    ctx.translate(pos.x, pos.y)
    ctx.rotate(rot)
    ctx.strokeStyle = "rgba(40, 18, 8, 0.7)"
    ctx.lineWidth = Math.max(1, ballR * 0.05)
    ctx.beginPath()
    ctx.moveTo(0, -ballR)
    ctx.lineTo(0, ballR)
    ctx.moveTo(-ballR, 0)
    ctx.lineTo(ballR, 0)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(0, 0, ballR * 0.55, ballR, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(0, 0, ballR, ballR * 0.55, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  /* ── swish burst → glowing data motes ────────────────────────── */
  const burst = clamp((p - 0.66) / 0.34)
  if (burst > 0) {
    ctx.globalCompositeOperation = "lighter"
    const eb = ease(burst)
    for (let i = 0; i < PARTICLES; i++) {
      const ang = rand(i) * Math.PI * 2
      const dist = (0.18 + rand(i + 7) * 0.8) * w * 0.42 * eb
      const lift = Math.sin(eb * Math.PI) * h * 0.12 * (0.5 + rand(i + 3))
      const px = rim.x + Math.cos(ang) * dist
      const py = rim.y + Math.sin(ang) * dist * 0.6 - lift
      const sz = (1 + rand(i + 11) * 2.4) * (1 - burst * 0.4)
      const col = rand(i + 5) > 0.66 ? CYAN : BRAND
      ctx.fillStyle = col(0.85 * (1 - eb * 0.7))
      ctx.beginPath()
      ctx.arc(px, py, sz, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = "source-over"
  }
}

export function CourtScrollScene({
  className,
  height = "260vh",
}: {
  className?: string
  height?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  })

  // caption crossfades tied to progress
  const o1 = useTransform(scrollYProgress, [0.02, 0.12, 0.24, 0.32], [0, 1, 1, 0])
  const o2 = useTransform(scrollYProgress, [0.34, 0.44, 0.56, 0.64], [0, 1, 1, 0])
  const o3 = useTransform(scrollYProgress, [0.68, 0.8, 0.97, 1], [0, 1, 1, 1])
  const hintO = useTransform(scrollYProgress, [0, 0.06, 0.12], [1, 1, 0])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let raf = 0
    let w = 0
    let h = 0

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas!.clientWidth
      h = canvas!.clientHeight
      canvas!.width = Math.round(w * dpr)
      canvas!.height = Math.round(h * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      render(reduce ? 0.72 : scrollYProgress.get())
    }
    function render(p: number) {
      drawScene(ctx!, w, h, p)
    }
    function onScroll(p: number) {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => render(p))
    }

    resize()
    window.addEventListener("resize", resize)
    const unsub = reduce ? undefined : scrollYProgress.on("change", onScroll)
    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(raf)
      unsub?.()
    }
  }, [reduce, scrollYProgress])

  return (
    <div ref={trackRef} className={className} style={{ height }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] mx-auto flex max-w-7xl flex-col justify-center px-4 sm:px-6"
        >
          <Caption
            style={{ opacity: reduce ? 1 : o3 }}
            kicker="03 · Compare"
            title={
              <>
                Swish.{" "}
                <span className="text-gradient-brand">Decoded.</span>
              </>
            }
            body="Every shot, possession and split — normalized to one scale, scattered into the numbers that win arguments."
          />
          {!reduce && (
            <>
              <Caption
                style={{ opacity: o1 }}
                kicker="01 · Ingest"
                title={<>The shot goes up.</>}
                body="Public box scores from six leagues, pulled the moment the buzzer sounds."
              />
              <Caption
                style={{ opacity: o2 }}
                kicker="02 · Normalize"
                title={<>Mid-air, it changes.</>}
                body="Spanish minutes, American possessions, EuroLeague pace — one model, one language."
              />
            </>
          )}
        </div>

        <motion.div
          aria-hidden
          style={{ opacity: hintO }}
          className="absolute bottom-8 left-1/2 z-[2] -translate-x-1/2 flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400"
        >
          Scroll to follow the shot
          <span className="flex h-8 w-5 items-start justify-center rounded-full border border-hairline-strong p-1">
            <span className="h-2 w-1 animate-pulse-soft rounded-full bg-brand-400" />
          </span>
        </motion.div>
      </div>
    </div>
  )
}

function Caption({
  style,
  kicker,
  title,
  body,
}: {
  style: React.ComponentProps<typeof motion.div>["style"]
  kicker: string
  title: React.ReactNode
  body: string
}) {
  return (
    <motion.div
      style={style}
      className="absolute inset-x-4 max-w-xl sm:inset-x-6 md:left-6 md:right-auto"
    >
      <span className="gh-eyebrow">{kicker}</span>
      <h2 className="mt-4 font-display text-4xl font-bold leading-[0.92] tracking-[-0.04em] text-ink-50 sm:text-6xl md:text-7xl">
        {title}
      </h2>
      <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-ink-300 sm:text-base">
        {body}
      </p>
    </motion.div>
  )
}
