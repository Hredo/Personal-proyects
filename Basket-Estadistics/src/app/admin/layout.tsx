import type { ReactNode } from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { readSessionUser } from "@/lib/auth/server-user"
import { isAdmin } from "@/lib/auth/current-user"

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin dashboard for managing the platform.",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await readSessionUser()
  if (!user) redirect("/login?next=/admin")
  if (!isAdmin(user)) redirect("/")

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink-50 sm:text-3xl">
          Admin
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          Database, sync, users, and cache management
        </p>
      </header>
      <main className="min-w-0 space-y-6">{children}</main>
    </div>
  )
}
