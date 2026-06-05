export function formatStat(
  n: number | null | undefined,
  digits = 1,
  suffix = "",
): string {
  if (n == null || Number.isNaN(n)) return "—"
  return `${n.toFixed(digits)}${suffix}`
}

export function formatPct(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "—"
  return `${(n * 100).toFixed(digits)}%`
}

export function formatInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—"
  return Math.round(n).toLocaleString("en-US")
}

export function formatHeight(cm: number | null | undefined): string {
  if (cm == null || Number.isNaN(cm)) return "—"
  const totalIn = cm / 2.54
  const ft = Math.floor(totalIn / 12)
  const inches = Math.round(totalIn - ft * 12)
  return `${ft}'${inches}"`
}

export function formatWeight(kg: number | null | undefined): string {
  if (kg == null || Number.isNaN(kg)) return "—"
  return `${kg} kg`
}

export function ageFrom(bd: string | null | undefined): number | null {
  if (!bd) return null
  const d = new Date(bd)
  if (Number.isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
}

export function getInitials(name: string, max = 2): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, max)
    .join("")
    .toUpperCase()
}
