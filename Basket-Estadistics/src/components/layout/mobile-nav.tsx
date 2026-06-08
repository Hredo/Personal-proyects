"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LEAGUE_FILTER_TREE } from "@/lib/league-groups"

const FEB_CHILDREN =
  LEAGUE_FILTER_TREE.find((n) => n.children)?.children ?? []

const PRIMARY_LINKS = [
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
  { href: "/coaches", label: "Coaches" },
  { href: "/compare", label: "Compare" },
  { href: "/leagues", label: "Leagues" },
  { href: "/ai-advisor", label: "AI Advisor" },
] as const

const EASE = [0.19, 1, 0.22, 1] as const

export function MobileNav() {
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
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="relative z-[110] inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-white/[0.05] text-ink-100 transition-colors duration-300 hover:border-brand-400/40 md:hidden"
      >
        <span className="relative block h-3 w-5">
          <span
            className={`absolute left-0 block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ease-fluid ${
              open ? "top-1.5 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute bottom-0 left-0 block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ease-fluid ${
              open ? "bottom-1.5 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-[100] flex flex-col bg-surface-0/85 backdrop-blur-2xl md:hidden"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-1/4 top-0 h-[60vh] w-[150%] animate-aurora rounded-full bg-brand-500/15 blur-3xl"
            />
            <div aria-hidden className="absolute inset-0 bg-dot-field opacity-50" />

            <nav className="relative flex flex-1 flex-col justify-center px-7">
              <ul className="space-y-1">
                {PRIMARY_LINKS.map((l, i) => {
                  const active =
                    pathname === l.href || pathname.startsWith(`${l.href}/`)
                  return (
                    <motion.li
                      key={l.href}
                      initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.06 * i + 0.08,
                        ease: EASE,
                      }}
                    >
                      <Link
                        href={l.href}
                        aria-current={active ? "page" : undefined}
                        className="group flex items-baseline gap-3"
                      >
                        <span className="font-mono text-[11px] tabular-nums text-brand-400/70">
                          0{i + 1}
                        </span>
                        <span
                          className={`font-display text-4xl font-bold tracking-[-0.03em] transition-colors duration-300 ${
                            active
                              ? "text-gradient-brand"
                              : "text-ink-100 group-hover:text-ink-50"
                          }`}
                        >
                          {l.label}
                        </span>
                      </Link>
                    </motion.li>
                  )
                })}
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
                className="mt-10"
              >
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
                  By league
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {LEAGUE_FILTER_TREE.map((node) => (
                    <Link
                      key={node.slug}
                      href={`/players?league=${node.slug}`}
                      className="gh-chip text-ink-200 transition-colors duration-200 hover:border-brand-400/40 hover:text-brand-200"
                    >
                      {node.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 border-l-2 border-brand-500/30 pl-2.5">
                  {FEB_CHILDREN.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/players?league=${c.slug}`}
                      className="gh-chip text-xs text-ink-300 transition-colors duration-200 hover:border-brand-400/40 hover:text-brand-200"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.58, ease: EASE }}
              className="relative hairline-t px-7 py-6"
            >
              <Link
                href="/compare"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-4 py-3.5 text-center text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition-colors duration-300 hover:bg-brand-400"
              >
                Open the console
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
