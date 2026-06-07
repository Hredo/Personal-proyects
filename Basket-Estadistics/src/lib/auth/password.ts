import bcrypt from "bcryptjs"

const COST = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST)
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  if (!plain || !hash) return false
  try {
    return await bcrypt.compare(plain, hash)
  } catch {
    return false
  }
}

export function isStrongPassword(pw: string): boolean {
  if (typeof pw !== "string") return false
  if (pw.length < 8 || pw.length > 200) return false
  let hasLower = false
  let hasUpper = false
  let hasDigit = false
  for (const ch of pw) {
    if (ch >= "a" && ch <= "z") hasLower = true
    else if (ch >= "A" && ch <= "Z") hasUpper = true
    else if (ch >= "0" && ch <= "9") hasDigit = true
    if (hasLower && hasUpper && hasDigit) return true
  }
  return false
}
