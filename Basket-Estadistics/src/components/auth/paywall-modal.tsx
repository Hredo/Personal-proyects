"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

type Variant = "free" | "auth" | "quota"

type Props = {
  open: boolean
  onClose: () => void
  variant: Variant
  feature: "advisor" | "compare"
}

const COPY: Record<Variant, { title: string; body: string; cta: string }> = {
  free: {
    title: "AI access is a Pro perk",
    body: "The advisor and AI compare are part of the Pro plan. Sign in or upgrade to keep using them.",
    cta: "Sign in",
  },
  auth: {
    title: "Sign in to keep exploring",
    body: "Create a free account in 20 seconds. Free users get one preview chat to try the advisor and the AI compare.",
    cta: "Sign in or register",
  },
  quota: {
    title: "You've used your free preview",
    body: "Free accounts get one shot at the AI. Upgrade to Pro to keep chatting with the advisor and run unlimited AI comparisons.",
    cta: "Upgrade to Pro",
  },
}

export function PaywallModal({ open, onClose, variant, feature }: Props) {
  const copy = COPY[variant]
  const ctaHref =
    variant === "quota"
      ? "mailto:Hrvaldes22@gmail.com?subject=Upgrade%20to%20Pro"
      : `/login?next=${encodeURIComponent(feature === "advisor" ? "/ai-advisor" : "/compare")}`
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="paywall-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-ink-950/70 px-4 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            key="paywall-card"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-ink-900/95 to-ink-950/95 p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paywall-title"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-accent-cyan/10 blur-3xl" />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-ink-300 transition hover:border-white/20 hover:text-ink-50"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <div className="relative">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/30">
                <svg
                  className="h-5 w-5 text-brand-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                  />
                </svg>
              </div>
              <h2
                id="paywall-title"
                className="font-display text-xl font-bold text-ink-50"
              >
                {copy.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">
                {copy.body}
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Link
                  href={ctaHref}
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400"
                >
                  {copy.cta}
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-ink-200 transition hover:border-white/20 hover:text-ink-50"
                >
                  Maybe later
                </button>
              </div>
              <p className="mt-3 text-[11px] text-ink-500">
                Pro keeps the same database, the same scout logic, and adds
                unlimited AI access and saved conversations.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default PaywallModal
