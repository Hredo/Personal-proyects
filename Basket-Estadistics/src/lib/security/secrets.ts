/**
 * Symmetric encryption for user-provided secrets (AI provider API keys).
 *
 * Keys are NEVER stored in plaintext. We use AES-256-GCM (authenticated
 * encryption) with a per-record random IV. The 32-byte data key is derived
 * with scrypt from ENCRYPTION_KEY (falling back to SESSION_SECRET in dev), so
 * the same input always yields the same data key across restarts while the
 * raw secret never touches disk.
 *
 * Wire format: `v1.<ivB64>.<tagB64>.<ciphertextB64>`
 */
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto"
import { getServerEnv } from "@/lib/env"

const VERSION = "v1"
const ALGO = "aes-256-gcm"
const IV_BYTES = 12
// Fixed application salt — combined with the configured secret in scrypt.
// Rotating the secret (not this salt) is what invalidates stored ciphertexts.
const SALT = Buffer.from("globalhoopstats.secrets.v1")

let cachedKey: Buffer | null = null

function dataKey(): Buffer {
  if (cachedKey) return cachedKey
  const env = getServerEnv()
  const secret = env.ENCRYPTION_KEY ?? env.SESSION_SECRET
  cachedKey = scryptSync(secret, SALT, 32)
  return cachedKey
}

function b64(buf: Buffer): string {
  return buf.toString("base64")
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGO, dataKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return `${VERSION}.${b64(iv)}.${b64(tag)}.${b64(ciphertext)}`
}

export function decryptSecret(payload: string): string | null {
  if (typeof payload !== "string") return null
  const parts = payload.split(".")
  if (parts.length !== 4) return null
  const [version, ivB64, tagB64, ctB64] = parts
  if (version !== VERSION) return null
  try {
    const iv = Buffer.from(ivB64, "base64")
    const tag = Buffer.from(tagB64, "base64")
    const ciphertext = Buffer.from(ctB64, "base64")
    const decipher = createDecipheriv(ALGO, dataKey(), iv)
    decipher.setAuthTag(tag)
    const plain = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ])
    return plain.toString("utf8")
  } catch {
    // Wrong key (secret rotated) or tampered ciphertext.
    return null
  }
}

/** Last 4 characters of a secret, for a masked UI preview (e.g. "····7Jk2"). */
export function last4(secret: string): string {
  const trimmed = secret.trim()
  return trimmed.length <= 4 ? trimmed : trimmed.slice(-4)
}
