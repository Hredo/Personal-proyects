export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export function uniqueSlug(
  base: string,
  existing: Set<string>,
  suffix?: string,
): string {
  const root = slugify(base) || "item"
  const candidate = suffix ? `${root}-${suffix}` : root
  if (!existing.has(candidate)) {
    existing.add(candidate)
    return candidate
  }
  let i = 2
  while (existing.has(`${candidate}-${i}`)) i++
  const finalSlug = `${candidate}-${i}`
  existing.add(finalSlug)
  return finalSlug
}

export function parseBirthdate(input?: string | null): string | undefined {
  if (!input) return undefined
  const trimmed = input.trim()
  if (!trimmed) return undefined
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (slashMatch) {
    const [, d, m, y] = slashMatch
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  const date = new Date(trimmed)
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10)
  }
  return undefined
}

export function parseHeightToCm(
  input?: string | number | null,
): number | undefined {
  if (input == null) return undefined
  if (typeof input === "number") {
    return input > 50 ? Math.round(input) : undefined
  }
  const trimmed = input.trim()
  if (!trimmed) return undefined
  const match = trimmed.match(/^(\d+)\s*['\u2019]\s*(\d+)\s*"?$/)
  if (match) {
    const feet = Number(match[1])
    const inches = Number(match[2])
    return Math.round(feet * 30.48 + inches * 2.54)
  }
  const cmMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:cm)?$/i)
  if (cmMatch) {
    const value = Number(cmMatch[1])
    return value > 50 ? Math.round(value) : undefined
  }
  return undefined
}

export function parseWeightToKg(
  input?: string | number | null,
): number | undefined {
  if (input == null) return undefined
  if (typeof input === "number") {
    return input > 30 ? Math.round(input) : undefined
  }
  const trimmed = input.trim()
  if (!trimmed) return undefined
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(kg|lbs?)?$/i)
  if (!match) return undefined
  const value = Number(match[1])
  const unit = (match[2] ?? "kg").toLowerCase()
  if (unit === "lb" || unit === "lbs") {
    return Math.round(value * 0.453592)
  }
  return Math.round(value)
}
