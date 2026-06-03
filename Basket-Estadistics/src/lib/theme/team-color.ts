export type TeamPalette = {
  source: string
  base: string
  scale: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
  }
  glow: string
  on: string
  muted: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.trim().replace(/^#/, "")
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.round(clamp(n, 0, 255))
      .toString(16)
      .padStart(2, "0")
  return `#${to(r)}${to(g)}${to(b)}`
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      default:
        h = (rn - gn) / d + 4
    }
    h *= 60
  }
  return { h, s, l }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hue = ((h % 360) + 360) % 360
  const sat = clamp(s, 0, 1)
  const light = clamp(l, 0, 1)
  const c = (1 - Math.abs(2 * light - 1)) * sat
  const hp = hue / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r1 = 0
  let g1 = 0
  let b1 = 0
  if (hp >= 0 && hp < 1) {
    r1 = c
    g1 = x
  } else if (hp < 2) {
    r1 = x
    g1 = c
  } else if (hp < 3) {
    g1 = c
    b1 = x
  } else if (hp < 4) {
    g1 = x
    b1 = c
  } else if (hp < 5) {
    r1 = x
    b1 = c
  } else {
    r1 = c
    b1 = x
  }
  const m = light - c / 2
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

export function buildTeamPalette(hex: string, source: string): TeamPalette | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const lightSteps: number[] = [
    0.94, 0.88, 0.8, 0.72, 0.64, 0.54, 0.46, 0.38, 0.3, 0.22,
  ]
  const chromaSteps: number[] = [
    0.05, 0.08, 0.1, 0.12, 0.14, 0.16, 0.18, 0.16, 0.14, 0.12,
  ]
  const labels: Array<keyof TeamPalette["scale"]> = [
    50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
  ]
  const scale = {} as TeamPalette["scale"]
  labels.forEach((label, i) => {
    const chromaBoost = chromaSteps[i] ?? 0.1
    const sAdjusted = clamp(
      s < 0.1 ? chromaBoost : s * (0.6 + chromaBoost),
      0,
      1,
    )
    const { r, g, b } = hslToRgb(h, sAdjusted, lightSteps[i] ?? 0.5)
    scale[label] = rgbToHex(r, g, b)
  })
  const glow = hex
  const on = l > 0.55 ? "#0b0b0b" : "#ffffff"
  const muted = scale[300]
  return {
    source,
    base: hex,
    scale,
    glow,
    on,
    muted,
  }
}

export function paletteToCss(palette: TeamPalette): Record<string, string> {
  return {
    "--team-50": palette.scale[50],
    "--team-100": palette.scale[100],
    "--team-200": palette.scale[200],
    "--team-300": palette.scale[300],
    "--team-400": palette.scale[400],
    "--team-500": palette.scale[500],
    "--team-600": palette.scale[600],
    "--team-700": palette.scale[700],
    "--team-800": palette.scale[800],
    "--team-900": palette.scale[900],
    "--team-glow": palette.glow,
    "--team-on": palette.on,
    "--team-muted": palette.muted,
  }
}
