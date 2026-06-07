import { cookies } from "next/headers"
import {
  getCurrentUser,
  type SessionUser,
} from "@/lib/auth/current-user"

export async function readSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ")
  return getCurrentUser(cookieHeader || null)
}
