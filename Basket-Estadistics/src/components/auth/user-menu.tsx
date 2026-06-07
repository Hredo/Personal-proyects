"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

type MeResponse = {
  user: {
    id: string
    email: string
    name: string
    plan: string
    role: string
  } | null
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}

function planBadge(plan: string, role: string): {
  label: string
  color: string
} {
  if (role === "admin")
    return {
      label: "Admin",
      color: "border-accent-magenta/50 bg-accent-magenta/10 text-accent-magenta",
    }
  if (plan === "pro")
    return {
      label: "Pro",
      color: "border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan",
    }
  return {
    label: "Free",
    color: "border-white/15 bg-white/[0.04] text-ink-300",
  }
}

export function UserMenu() {
  const router = useRouter()
  const [me, setMe] = useState<MeResponse["user"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    let alive = true
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json() as Promise<MeResponse>)
      .then((data) => {
        if (alive) {
          setMe(data.user)
          setLoading(false)
        }
      })
      .catch(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        menuRef.current?.contains(t) ||
        buttonRef.current?.contains(t)
      ) {
        return
      }
      setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onEsc)
    }
  }, [open])

  if (loading) {
    return (
      <div className="hidden h-9 w-24 animate-pulse rounded-md bg-white/[0.04] md:block" />
    )
  }

  if (!me) {
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href="/login"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-200 transition hover:text-ink-50"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400"
        >
          Get started
        </Link>
      </div>
    )
  }

  const badge = planBadge(me.plan, me.role)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // ignore
    }
    setOpen(false)
    router.refresh()
    router.push("/")
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 pr-3 transition hover:border-white/25 hover:bg-white/[0.08]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-bold text-ink-950">
          {initials(me.name)}
        </span>
        <span className="hidden text-xs font-medium text-ink-100 sm:inline">
          {me.name.split(" ")[0]}
        </span>
        <span
          className={`hidden rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest sm:inline-flex ${badge.color}`}
        >
          {badge.label}
        </span>
        <svg
          className={`h-3 w-3 text-ink-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 p-1.5 shadow-2xl backdrop-blur-md"
            role="menu"
          >
            <div className="px-3 py-2.5">
              <p className="text-sm font-semibold text-ink-50">{me.name}</p>
              <p className="truncate text-xs text-ink-400">{me.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${badge.color}`}
                >
                  {badge.label}
                </span>
                {me.plan === "free" && me.role !== "admin" ? (
                  <Link
                    href="mailto:Hrvaldes22@gmail.com?subject=Upgrade%20to%20Pro"
                    className="text-[11px] text-brand-300 transition hover:text-brand-200"
                    onClick={() => setOpen(false)}
                  >
                    Upgrade →
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="my-1 h-px bg-white/5" />
            <MenuLink href="/ai-advisor" onSelect={() => setOpen(false)}>
              AI Advisor
            </MenuLink>
            <MenuLink href="/players" onSelect={() => setOpen(false)}>
              Players
            </MenuLink>
            <MenuLink href="/teams" onSelect={() => setOpen(false)}>
              Teams
            </MenuLink>
            <MenuLink href="/compare" onSelect={() => setOpen(false)}>
              Compare
            </MenuLink>
            <div className="my-1 h-px bg-white/5" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink-200 transition hover:bg-white/[0.05] hover:text-ink-50"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12H3m0 0l4-4m-4 4l4 4m11-9V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2h9a2 2 0 002-2v-2"
                />
              </svg>
              Sign out
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function MenuLink({
  href,
  children,
  onSelect,
}: {
  href: string
  children: React.ReactNode
  onSelect: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex items-center rounded-md px-3 py-2 text-sm text-ink-200 transition hover:bg-white/[0.05] hover:text-ink-50"
    >
      {children}
    </Link>
  )
}

export default UserMenu
