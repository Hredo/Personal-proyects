"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type LeagueOption = { slug: string; name: string }

type Props = {
  leagues: LeagueOption[]
}

const PRIMARY_LINKS = [
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
  { href: "/coaches", label: "Coaches" },
  { href: "/compare", label: "Compare" },
  { href: "/leagues", label: "Leagues" },
] as const

export function MobileNav({ leagues }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-ink-200 transition hover:border-brand-400/40 hover:text-ink-50 md:hidden"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
          />
        </svg>
      </button>

      <div
        className={`fixed inset-0 z-[90] md:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink-950/70 backdrop-blur-sm transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          tabIndex={open ? 0 : -1}
        />
        <aside
          id="mobile-nav-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className={`absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col overflow-y-auto border-l border-white/10 bg-ink-950 shadow-2xl shadow-black/60 transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <span className="font-display text-sm font-bold uppercase tracking-widest text-ink-200">
              Menu
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-ink-200 transition hover:border-brand-400/40 hover:text-ink-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-1">
              {PRIMARY_LINKS.map((l) => {
                const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={`block rounded-lg px-3 py-2.5 text-base font-medium transition ${
                        active
                          ? "bg-brand-500/10 text-brand-200"
                          : "text-ink-100 hover:bg-white/[0.04] hover:text-brand-200"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <p className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
              Leagues
            </p>
            <ul className="mt-2 space-y-1">
              {leagues.map((lg) => (
                <li key={lg.slug}>
                  <Link
                    href={`/players?league=${lg.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm text-ink-200 transition hover:bg-white/[0.04] hover:text-brand-200"
                  >
                    {lg.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-white/5 px-5 py-4">
            <a
              href="#waitlist"
              onClick={() => setOpen(false)}
              className="block w-full rounded-md bg-brand-500 px-4 py-2.5 text-center text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400"
            >
              Request access
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}
