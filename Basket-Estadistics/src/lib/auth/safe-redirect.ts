/**
 * Sanitise a post-login `next` redirect target.
 *
 * Only same-site absolute paths are allowed. A bare `startsWith("/")` check is
 * NOT enough: protocol-relative URLs (`//evil.com`) and backslash tricks
 * (`/\evil.com`) also start with a slash but resolve to an external origin via
 * `new URL(next, origin)` or the client router, enabling open redirects.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/ai-advisor",
): string {
  if (!raw) return fallback
  // Require a single leading slash not followed by another slash or backslash.
  if (!/^\/(?![/\\])/.test(raw)) return fallback
  return raw
}
