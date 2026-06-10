"use client"

import { useEffect, useRef } from "react"

/**
 * One-on-one basketball duel — two low-poly "figurine" players rendered with a
 * tiny hand-rolled 3D pipeline on a transparent 2D canvas. No three.js, no
 * models, no textures: every vertex is procedural, so the whole scene ships in
 * this file and costs a few KB.
 *
 * Resource budget (the panel is decorative):
 *  - capped at 30fps via a frame accumulator
 *  - devicePixelRatio capped at 1.5
 *  - fully paused when the tab is hidden or the canvas is off-screen/display:none
 *  - prefers-reduced-motion renders a single static frame
 *  - transparent background → the global body backdrop shows through, no seams
 */

type Vec = { x: number; y: number; z: number }

const TAU = Math.PI * 2

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
function smooth(a: number, b: number, v: number): number {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// ── Play phases (ms) ─────────────────────────────────────────────
const PH = { iso: 2400, drive: 1500, shoot: 950, flight: 800, score: 900, reset: 2050 }
const CYCLE = PH.iso + PH.drive + PH.shoot + PH.flight + PH.score + PH.reset

const RIM: Vec = { x: 0, y: 3.02, z: 10.5 }
const BALL_R = 0.125

// [h, s, l] palettes — P0 wears brand orange, P1 a cool cyan.
type Palette = { jersey: [number, number, number]; limb: [number, number, number]; head: [number, number, number]; num: string }
const PAL0: Palette = { jersey: [27, 90, 54], limb: [26, 62, 40], head: [31, 65, 72], num: "7" }
const PAL1: Palette = { jersey: [200, 60, 56], limb: [205, 42, 38], head: [202, 40, 74], num: "23" }

type ArmMode = "swing" | "ball" | "up" | "guard" | "raise"
type PlayerState = {
  x: number
  z: number
  pelvisY: number
  dirX: number
  dirZ: number
  crouch: number
  legPhase: number
  legAmp: number
  stance: number
  armL: ArmMode
  armR: ArmMode
}

type Scene = {
  att: PlayerState
  def: PlayerState
  ball: Vec & { spin: number; held: boolean }
  netRipple: number
  rimGlow: number
  attIsP0: boolean
}

function newPlayer(): PlayerState {
  return { x: 0, z: 5, pelvisY: 0.96, dirX: 0, dirZ: 1, crouch: 0.3, legPhase: 0, legAmp: 0, stance: 0.3, armL: "swing", armR: "swing" }
}

export function AuthDuel({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let raf: number | null = null
    let last = 0
    let visible = !document.hidden
    let onScreen = true
    const dpr = Math.min(1.5, window.devicePixelRatio || 1)
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // ── Camera & projection ──────────────────────────────────────
    const cam = { x: 0, y: 2.1, z: -2.2, pitch: -0.1, yaw: 0 }
    let scale = 1
    let cx = 0
    let cy = 0

    type Proj = { x: number; y: number; k: number; z: number }
    const project = (x: number, y: number, z: number, out: Proj): Proj => {
      let dx = x - cam.x
      const dy = y - cam.y
      let dz = z - cam.z
      const cyaw = Math.cos(cam.yaw)
      const syaw = Math.sin(cam.yaw)
      const rx = dx * cyaw - dz * syaw
      dz = dx * syaw + dz * cyaw
      dx = rx
      const cp = Math.cos(cam.pitch)
      const sp = Math.sin(cam.pitch)
      const ry = dy * cp - dz * sp
      let rz = dy * sp + dz * cp
      if (rz < 0.5) rz = 0.5
      const k = scale / rz
      out.x = cx + dx * k
      out.y = cy - ry * k
      out.k = k
      out.z = rz
      return out
    }
    const pa: Proj = { x: 0, y: 0, k: 0, z: 0 }
    const pb: Proj = { x: 0, y: 0, k: 0, z: 0 }
    const pc: Proj = { x: 0, y: 0, k: 0, z: 0 }
    const pd: Proj = { x: 0, y: 0, k: 0, z: 0 }

    const shade = (z: number): number => Math.max(0.62, Math.min(1.08, 1.32 - z * 0.05))
    const col = (c: [number, number, number], b: number, a = 1): string =>
      `hsla(${c[0]}, ${c[1]}%, ${Math.min(92, c[2] * b)}%, ${a})`

    // ── Painter's queue (reused) ─────────────────────────────────
    const prims: Array<{ z: number; draw: () => void }> = []
    const push = (z: number, draw: () => void) => prims.push({ z, draw })

    const capsule = (
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number,
      w: number, c: [number, number, number],
    ) => {
      project(x1, y1, z1, pa)
      project(x2, y2, z2, pb)
      const ax = pa.x, ay = pa.y, bx = pb.x, by = pb.y
      const lw = Math.max(1.5, w * (pa.k + pb.k) * 0.5)
      const depth = (pa.z + pb.z) / 2
      const color = col(c, shade(depth))
      push(depth, () => {
        ctx.strokeStyle = color
        ctx.lineWidth = lw
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()
      })
    }

    const contactShadow = (x: number, z: number, r: number, alpha: number) => {
      project(x, 0, z, pa)
      const sx = pa.x, sy = pa.y, rx = r * pa.k
      push(pa.z + 50, () => {
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
        ctx.beginPath()
        ctx.ellipse(sx, sy, rx, rx * 0.3, 0, 0, TAU)
        ctx.fill()
      })
    }

    // ── Court (drawn first, no sorting needed) ───────────────────
    const line3 = (x1: number, z1: number, x2: number, z2: number, alpha: number, lw = 1.2) => {
      project(x1, 0, z1, pa)
      project(x2, 0, z2, pb)
      ctx.strokeStyle = `hsla(33, 82%, 60%, ${alpha})`
      ctx.lineWidth = lw
      ctx.beginPath()
      ctx.moveTo(pa.x, pa.y)
      ctx.lineTo(pb.x, pb.y)
      ctx.stroke()
    }

    const arc3 = (cxw: number, czw: number, r: number, a0: number, a1: number, steps: number, alpha: number) => {
      ctx.strokeStyle = `hsla(33, 82%, 60%, ${alpha})`
      ctx.lineWidth = 1.2
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const a = a0 + ((a1 - a0) * i) / steps
        project(cxw + r * Math.sin(a), 0, czw - r * Math.cos(a), pa)
        if (i === 0) ctx.moveTo(pa.x, pa.y)
        else ctx.lineTo(pa.x, pa.y)
      }
      ctx.stroke()
    }

    const drawCourt = () => {
      for (let z = 3; z <= 11; z += 2) line3(-3.6, z, 3.6, z, 0.05)
      for (let x = -3; x <= 3; x += 1.5) line3(x, 2.6, x, 11, 0.04)
      line3(-2.6, 11, 2.6, 11, 0.16, 1.4)
      line3(-1.2, 8.2, 1.2, 8.2, 0.12)
      line3(-1.2, 8.2, -1.2, 11, 0.1)
      line3(1.2, 8.2, 1.2, 11, 0.1)
      arc3(0, 8.2, 1.0, -Math.PI, 0, 20, 0.1)
      arc3(RIM.x, RIM.z, 4.3, -1.15, 1.15, 26, 0.13)
    }

    const drawHoop = (netRipple: number, rimGlow: number, now: number) => {
      capsule(0, 3.34, 11.4, 0, 0, 11.4, 0.07, [220, 4, 26])
      capsule(0, 3.3, 11.4, 0, 3.22, 10.95, 0.06, [220, 4, 30])
      // backboard
      project(-0.85, 3.95, 10.92, pa)
      project(0.85, 3.95, 10.92, pb)
      project(0.85, 2.92, 10.92, pc)
      project(-0.85, 2.92, 10.92, pd)
      const bb = [pa.x, pa.y, pb.x, pb.y, pc.x, pc.y, pd.x, pd.y]
      push(pa.z + 0.2, () => {
        ctx.beginPath()
        ctx.moveTo(bb[0], bb[1])
        ctx.lineTo(bb[2], bb[3])
        ctx.lineTo(bb[4], bb[5])
        ctx.lineTo(bb[6], bb[7])
        ctx.closePath()
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
        ctx.fill()
        ctx.strokeStyle = "rgba(255, 255, 255, 0.28)"
        ctx.lineWidth = 1.2
        ctx.stroke()
      })
      // rim — project a horizontal circle point by point
      const rimPts: number[] = []
      let rimDepth = 0
      for (let i = 0; i <= 14; i++) {
        const a = (i / 14) * TAU
        project(RIM.x + 0.23 * Math.cos(a), RIM.y, RIM.z + 0.23 * Math.sin(a), pa)
        rimPts.push(pa.x, pa.y)
        rimDepth = pa.z
      }
      push(rimDepth - 0.3, () => {
        if (rimGlow > 0.01) {
          ctx.strokeStyle = `hsla(33, 95%, 65%, ${rimGlow * 0.5})`
          ctx.lineWidth = 6 + (1 - rimGlow) * 26
          ctx.beginPath()
          for (let i = 0; i < rimPts.length; i += 2) {
            if (i === 0) ctx.moveTo(rimPts[0], rimPts[1])
            else ctx.lineTo(rimPts[i], rimPts[i + 1])
          }
          ctx.stroke()
        }
        ctx.strokeStyle = "hsla(20, 92%, 56%, 0.95)"
        ctx.lineWidth = 2.6
        ctx.beginPath()
        for (let i = 0; i < rimPts.length; i += 2) {
          if (i === 0) ctx.moveTo(rimPts[0], rimPts[1])
          else ctx.lineTo(rimPts[i], rimPts[i + 1])
        }
        ctx.stroke()
        // net
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
        ctx.lineWidth = 0.9
        for (let s = 0; s < 6; s++) {
          const a = (s / 6) * TAU
          project(RIM.x + 0.21 * Math.cos(a), RIM.y - 0.02, RIM.z + 0.21 * Math.sin(a), pa)
          const swayX = Math.sin(s * 2.1 + now * 0.004) * netRipple * 8
          project(RIM.x + 0.08 * Math.cos(a), RIM.y - 0.42, RIM.z + 0.08 * Math.sin(a), pb)
          ctx.beginPath()
          ctx.moveTo(pa.x, pa.y)
          ctx.quadraticCurveTo((pa.x + pb.x) / 2 + swayX, (pa.y + pb.y) / 2, pb.x + swayX * 0.6, pb.y)
          ctx.stroke()
        }
      })
    }

    // ── Player rig ───────────────────────────────────────────────
    const armPoint = (
      mode: ArmMode,
      sx: number, sy: number, sz: number,
      latX: number, latZ: number, sideSign: number,
      p: PlayerState,
      ball: Vec,
      swingPhase: number,
    ): { hx: number; hy: number; hz: number; ex: number; ey: number; ez: number } => {
      let hx: number, hy: number, hz: number
      if (mode === "ball") {
        const dx = ball.x - sx, dy = ball.y - sy, dz = ball.z - sz
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
        const reach = Math.min(d, 0.74)
        hx = sx + (dx / d) * reach
        hy = sy + (dy / d) * reach
        hz = sz + (dz / d) * reach
      } else if (mode === "up") {
        hx = sx + p.dirX * 0.08
        hy = sy + 0.6
        hz = sz + p.dirZ * 0.08
      } else if (mode === "raise") {
        hx = sx + p.dirX * 0.2
        hy = sy + 0.5
        hz = sz + p.dirZ * 0.2
      } else if (mode === "guard") {
        hx = sx + latX * sideSign * 0.32 + p.dirX * 0.22
        hy = sy - 0.08
        hz = sz + latZ * sideSign * 0.32 + p.dirZ * 0.22
      } else {
        const sw = Math.sin(swingPhase) * 0.24 * Math.max(0.25, p.legAmp)
        hx = sx + p.dirX * sw
        hy = sy - 0.42
        hz = sz + p.dirZ * sw
      }
      const ex = (sx + hx) / 2 + latX * sideSign * 0.14
      const ey = (sy + hy) / 2 - 0.04
      const ez = (sz + hz) / 2 + latZ * sideSign * 0.14
      return { hx, hy, hz, ex, ey, ez }
    }

    const drawPlayer = (p: PlayerState, pal: Palette, ball: Vec) => {
      const latX = -p.dirZ
      const latZ = p.dirX
      const py = p.pelvisY
      const shY = py + 0.5 - p.crouch * 0.07
      const shFwd = p.crouch * 0.22
      const shLX = p.x + latX * 0.19 + p.dirX * shFwd
      const shLZ = p.z + latZ * 0.19 + p.dirZ * shFwd
      const shRX = p.x - latX * 0.19 + p.dirX * shFwd
      const shRZ = p.z - latZ * 0.19 + p.dirZ * shFwd
      const hipLX = p.x + latX * 0.13, hipLZ = p.z + latZ * 0.13
      const hipRX = p.x - latX * 0.13, hipRZ = p.z - latZ * 0.13

      // legs
      for (let leg = 0; leg < 2; leg++) {
        const hx = leg === 0 ? hipLX : hipRX
        const hz = leg === 0 ? hipLZ : hipRZ
        const phase = p.legPhase + (leg === 0 ? 0 : Math.PI)
        const stepF = Math.sin(phase) * 0.42 * p.legAmp
        const lift = Math.max(0, Math.sin(phase + 0.9)) * 0.17 * p.legAmp
        const wide = (leg === 0 ? 1 : -1) * p.stance * 0.17
        const fx = hx + p.dirX * stepF + latX * wide
        const fz = hz + p.dirZ * stepF + latZ * wide
        const fy = lift
        const kx = (hx + fx) / 2 + p.dirX * (0.12 + p.crouch * 0.14)
        const ky = (py + fy) / 2 + 0.04
        const kz = (hz + fz) / 2 + p.dirZ * (0.12 + p.crouch * 0.14)
        capsule(hx, py, hz, kx, ky, kz, 0.105, pal.limb)
        capsule(kx, ky, kz, fx, fy + 0.05, fz, 0.085, pal.limb)
      }

      // torso (filled quad + jersey number)
      project(shLX, shY, shLZ, pa)
      project(shRX, shY, shRZ, pb)
      project(hipRX, py, hipRZ, pc)
      project(hipLX, py, hipLZ, pd)
      const tq = [pa.x, pa.y, pb.x, pb.y, pc.x, pc.y, pd.x, pd.y]
      const tDepth = (pa.z + pc.z) / 2
      const tColor = col(pal.jersey, shade(tDepth))
      const tNumSize = 0.21 * pa.k
      push(tDepth, () => {
        ctx.beginPath()
        ctx.moveTo(tq[0], tq[1])
        ctx.lineTo(tq[2], tq[3])
        ctx.lineTo(tq[4], tq[5])
        ctx.lineTo(tq[6], tq[7])
        ctx.closePath()
        ctx.fillStyle = tColor
        ctx.fill()
        ctx.strokeStyle = "rgba(10, 7, 4, 0.5)"
        ctx.lineWidth = 1.1
        ctx.stroke()
        ctx.fillStyle = "rgba(10, 7, 4, 0.4)"
        ctx.font = `700 ${tNumSize}px var(--font-mono, monospace)`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(pal.num, (tq[0] + tq[2] + tq[4] + tq[6]) / 4, (tq[1] + tq[3] + tq[5] + tq[7]) / 4 - tNumSize * 0.2)
      })

      // head
      const hdX = (shLX + shRX) / 2 + p.dirX * 0.04
      const hdZ = (shLZ + shRZ) / 2 + p.dirZ * 0.04
      project(hdX, shY + 0.22, hdZ, pa)
      const hr = 0.115 * pa.k
      const hX = pa.x, hY = pa.y, hD = pa.z
      const hColor = col(pal.head, shade(hD))
      push(hD - 0.01, () => {
        ctx.beginPath()
        ctx.arc(hX, hY, hr, 0, TAU)
        ctx.fillStyle = hColor
        ctx.fill()
        ctx.strokeStyle = "rgba(10, 7, 4, 0.45)"
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(hX - hr * 0.3, hY - hr * 0.35, hr * 0.32, 0, TAU)
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)"
        ctx.fill()
      })

      // arms
      const swing = p.legPhase + Math.PI
      const aL = armPoint(p.armL, shLX, shY, shLZ, latX, latZ, 1, p, ball, swing)
      const aR = armPoint(p.armR, shRX, shY, shRZ, latX, latZ, -1, p, ball, swing + Math.PI)
      capsule(shLX, shY, shLZ, aL.ex, aL.ey, aL.ez, 0.085, pal.jersey)
      capsule(aL.ex, aL.ey, aL.ez, aL.hx, aL.hy, aL.hz, 0.07, pal.head)
      capsule(shRX, shY, shRZ, aR.ex, aR.ey, aR.ez, 0.085, pal.jersey)
      capsule(aR.ex, aR.ey, aR.ez, aR.hx, aR.hy, aR.hz, 0.07, pal.head)

      contactShadow(p.x, p.z, 0.34, 0.28)
    }

    const drawBall = (b: Scene["ball"]) => {
      project(b.x, b.y, b.z, pa)
      const r = Math.max(2.5, BALL_R * pa.k)
      const bx = pa.x, by = pa.y, bd = pa.z
      const body = `hsl(26, 90%, ${Math.round(52 * shade(bd))}%)`
      const spin = b.spin
      push(bd - 0.05, () => {
        ctx.beginPath()
        ctx.arc(bx, by, r, 0, TAU)
        ctx.fillStyle = body
        ctx.fill()
        ctx.strokeStyle = "rgba(60, 22, 8, 0.8)"
        ctx.lineWidth = Math.max(0.8, r * 0.09)
        ctx.stroke()
        ctx.save()
        ctx.translate(bx, by)
        ctx.rotate(spin)
        ctx.beginPath()
        ctx.moveTo(-r, 0)
        ctx.lineTo(r, 0)
        ctx.stroke()
        ctx.beginPath()
        ctx.ellipse(0, 0, r * 0.45, r, 0, 0, TAU)
        ctx.stroke()
        ctx.restore()
        ctx.beginPath()
        ctx.arc(bx - r * 0.3, by - r * 0.35, r * 0.28, 0, TAU)
        ctx.fillStyle = "rgba(255, 235, 210, 0.35)"
        ctx.fill()
      })
      contactShadow(b.x, b.z, 0.2, 0.3 * Math.max(0.15, 1 - b.y / 3.2))
    }

    // ── Choreography ─────────────────────────────────────────────
    const S: Scene = {
      att: newPlayer(),
      def: newPlayer(),
      ball: { x: 0, y: 1, z: 5, spin: 0, held: false },
      netRipple: 0,
      rimGlow: 0,
      attIsP0: true,
    }

    const face = (p: PlayerState, tx: number, tz: number) => {
      const dx = tx - p.x, dz = tz - p.z
      const d = Math.sqrt(dx * dx + dz * dz) || 1
      p.dirX = dx / d
      p.dirZ = dz / d
    }

    const bounceY = (t: number, n: number, hand: number): number =>
      BALL_R + (hand - BALL_R) * Math.pow(Math.abs(Math.cos(t * Math.PI * n)), 0.82)

    const computeScene = (now: number) => {
      const cycle = Math.floor(now / CYCLE)
      let t = now - cycle * CYCLE
      S.attIsP0 = cycle % 2 === 0
      const side = S.attIsP0 ? 1 : -1
      const att = S.att
      const def = S.def
      const ball = S.ball

      const attStartX = side * 1.35, attStartZ = 4.8
      const defStartX = side * 0.65, defStartZ = 6.5
      const attEndX = side * 0.3, attEndZ = 8.7
      const defEndX = side * 0.32, defEndZ = 9.5

      att.pelvisY = 0.96
      def.pelvisY = 0.96
      S.netRipple = 0
      S.rimGlow = 0
      ball.spin += 0.06
      ball.held = false
      att.armL = "swing"
      att.armR = "swing"
      def.armL = "guard"
      def.armR = "guard"

      if (t < PH.iso) {
        const p = t / PH.iso
        const cs = Math.tanh(2.6 * Math.cos(p * TAU * 1.2))
        att.x = attStartX + Math.sin(p * TAU * 1.2) * 0.1
        att.z = attStartZ + Math.sin(p * TAU * 0.6) * 0.12
        att.crouch = 0.42
        att.legPhase = p * TAU * 2.6
        att.legAmp = 0.3
        att.stance = 0.4
        face(att, RIM.x, RIM.z)
        ball.x = att.x + cs * 0.42 * side
        ball.y = bounceY(p, 5, 0.92 - Math.abs(Math.sin(p * TAU * 1.2)) * 0.18)
        ball.z = att.z + 0.2
        const ballRight = (ball.x - att.x) * att.dirZ - (ball.z - att.z) * att.dirX > 0
        att.armL = ballRight ? "swing" : "ball"
        att.armR = ballRight ? "ball" : "swing"
        const lag = Math.tanh(2.6 * Math.cos((p - 0.05) * TAU * 1.2))
        def.x = defStartX + lag * 0.17 * side
        def.z = defStartZ
        def.crouch = 0.62
        def.legAmp = 0
        def.stance = 1
        face(def, att.x, att.z)
      } else if ((t -= PH.iso) < PH.drive) {
        const p = t / PH.drive
        const u = easeInOut(p)
        att.x = lerp(attStartX, attEndX, u)
        att.z = lerp(attStartZ, attEndZ, u)
        att.crouch = 0.5
        att.legPhase = p * TAU * 3.4
        att.legAmp = 1
        att.stance = 0.2
        face(att, RIM.x, RIM.z)
        ball.x = att.x + side * 0.4 * (1 - u * 0.5)
        ball.y = bounceY(p, 3, 0.8)
        ball.z = att.z + 0.26
        att.armL = side < 0 ? "ball" : "swing"
        att.armR = side < 0 ? "swing" : "ball"
        def.x = lerp(defStartX, defEndX, u)
        def.z = lerp(defStartZ, defEndZ, u)
        def.crouch = 0.6
        def.legPhase = p * TAU * 3.4
        def.legAmp = 0.75
        def.stance = 0.7
        face(def, att.x, att.z)
      } else if ((t -= PH.drive) < PH.shoot) {
        const p = t / PH.shoot
        att.x = attEndX
        att.z = attEndZ
        const jq = p < 0.3 ? 0 : ((p - 0.3) / 0.7) * 0.55
        att.pelvisY = 0.96 + 0.5 * Math.sin(Math.PI * jq)
        att.crouch = p < 0.3 ? 0.62 - p : 0.18
        att.legAmp = 0
        att.stance = 0.4
        face(att, RIM.x, RIM.z)
        ball.held = true
        const w1 = smooth(0, 0.4, p)
        const w2 = smooth(0.38, 1, p)
        ball.x = lerp(att.x + side * 0.34, att.x * 0.82, Math.max(w1, w2))
        ball.y = lerp(lerp(0.85, 1.42, w1), 2.34 + (att.pelvisY - 0.96), w2)
        ball.z = att.z + lerp(0.24, 0.3, w2)
        att.armL = "ball"
        att.armR = "ball"
        def.x = defEndX
        def.z = defEndZ
        const dj = smooth(0.55, 1, p)
        def.pelvisY = 0.96 + 0.3 * Math.sin(Math.PI * dj * 0.5)
        def.crouch = 0.4 - dj * 0.2
        def.legAmp = 0
        def.stance = 0.8
        def.armR = "up"
        face(def, att.x, att.z)
      } else if ((t -= PH.shoot) < PH.flight) {
        const p = t / PH.flight
        att.x = attEndX
        att.z = attEndZ
        const jq = 0.55 + clamp01(p / 0.45) * 0.45
        att.pelvisY = 0.96 + 0.5 * Math.sin(Math.PI * jq)
        att.crouch = 0.22
        att.legAmp = 0
        att.stance = 0.4
        att.armL = "raise"
        att.armR = "raise"
        face(att, RIM.x, RIM.z)
        const rx = attEndX * 0.82
        const rz = attEndZ + 0.3
        ball.x = lerp(rx, RIM.x, p)
        ball.z = lerp(rz, RIM.z - 0.06, p)
        ball.y = lerp(2.82, RIM.y + 0.05, p) + 0.6 * 4 * p * (1 - p)
        def.x = defEndX
        def.z = defEndZ
        def.pelvisY = 0.96 + 0.42 * Math.sin(Math.PI * clamp01((p + 0.3) / 0.85))
        def.crouch = 0.2
        def.legAmp = 0
        def.stance = 0.7
        def.armR = "up"
        face(def, RIM.x, RIM.z)
      } else if ((t -= PH.flight) < PH.score) {
        const p = t / PH.score
        att.x = attEndX
        att.z = attEndZ
        att.crouch = 0.3
        att.legAmp = 0
        att.stance = 0.5
        att.armL = p < 0.4 ? "raise" : "swing"
        att.armR = "swing"
        face(att, RIM.x, RIM.z)
        def.x = defEndX
        def.z = defEndZ
        def.crouch = 0.35
        def.legAmp = 0
        def.stance = 0.7
        def.armL = "swing"
        def.armR = "swing"
        face(def, RIM.x, RIM.z)
        S.netRipple = Math.sin(clamp01(p / 0.5) * Math.PI)
        S.rimGlow = 1 - clamp01(p / 0.7)
        if (p < 0.42) {
          const u = p / 0.42
          ball.x = RIM.x
          ball.y = RIM.y - (RIM.y - BALL_R) * u * u
          ball.z = RIM.z - 0.1
        } else {
          const v = (p - 0.42) / 0.58
          ball.x = RIM.x - side * v * 0.5
          ball.y = BALL_R + Math.abs(Math.sin(v * Math.PI * 1.5)) * 0.3 * (1 - v)
          ball.z = RIM.z - 0.1 - v * 0.7
        }
      } else {
        const p = (t - PH.score) / PH.reset
        const u = easeInOut(p)
        const ns = -side
        // current attacker walks back to defend; defender becomes the attacker
        att.x = lerp(attEndX, ns * 0.65, u)
        att.z = lerp(attEndZ, 6.5, u)
        def.x = lerp(defEndX, ns * 1.35, u)
        def.z = lerp(defEndZ, 4.8, u)
        const walkAmp = Math.sin(Math.min(1, p * 1.3) * Math.PI) * 0.7
        att.legPhase = p * TAU * 2.8
        att.legAmp = walkAmp
        att.crouch = 0.3
        att.stance = 0.3
        def.legPhase = p * TAU * 2.8 + 1.3
        def.legAmp = walkAmp
        def.crouch = 0.3
        def.stance = 0.3
        att.armL = "swing"
        att.armR = "swing"
        def.armL = "swing"
        def.armR = "swing"
        if (p > 0.82) {
          face(att, def.x, def.z)
          face(def, RIM.x, RIM.z)
        } else {
          face(att, ns * 0.65, 6.5)
          face(def, ns * 1.35, 4.8)
        }
        ball.x = def.x + ns * 0.36
        ball.y = 0.95 + Math.sin(p * TAU * 2.8) * 0.04
        ball.z = def.z + 0.1
        ball.held = true
        def.armR = ns > 0 ? "ball" : "swing"
        def.armL = ns > 0 ? "swing" : "ball"
      }
    }

    // ── Frame ────────────────────────────────────────────────────
    const renderFrame = (now: number) => {
      ctx.clearRect(0, 0, width, height)
      cam.yaw = Math.sin(now * 0.00009) * 0.06
      computeScene(now)
      prims.length = 0
      drawCourt()
      drawHoop(S.netRipple, S.rimGlow, now)
      drawPlayer(S.att, S.attIsP0 ? PAL0 : PAL1, S.ball)
      drawPlayer(S.def, S.attIsP0 ? PAL1 : PAL0, S.ball)
      drawBall(S.ball)
      prims.sort((a, b) => b.z - a.z)
      for (let i = 0; i < prims.length; i++) prims[i].draw()
    }

    const FRAME_MS = 1000 / 30
    const loop = (now: number) => {
      raf = null
      if (!visible || !onScreen) return
      if (now - last >= FRAME_MS) {
        last = now
        renderFrame(now)
      }
      raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      if (reduced) return
      if (visible && onScreen && raf === null) raf = requestAnimationFrame(loop)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      scale = Math.min(width, height)
      cx = width * 0.55
      cy = height * 0.5
      renderFrame(reduced ? PH.iso * 0.3 : last || PH.iso * 0.3)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const io = new IntersectionObserver((entries) => {
      onScreen = entries[0]?.isIntersecting ?? true
      wake()
    })
    io.observe(canvas)

    const onVis = () => {
      visible = !document.hidden
      wake()
    }
    document.addEventListener("visibilitychange", onVis)
    wake()

    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden />
}

export default AuthDuel
