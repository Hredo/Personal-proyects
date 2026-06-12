"use client"

import { useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          website: honeypot,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(payload.error ?? "Something went wrong. Please try again.")
        return
      }
      setSent(true)
    } catch {
      setError("We couldn't reach the server. Check your connection and retry.")
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
            <svg
              className="h-7 w-7 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-50">
            Check your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-300">
            If an account with that email exists, we&apos;ve sent a password reset link.
            It expires in 15 minutes.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm text-brand-400 transition hover:text-brand-300"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to sign in
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-ink-300 transition hover:text-ink-50"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-ink-50 sm:text-4xl">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            aria-hidden
          />
          <div className="relative">
            <label
              htmlFor="email"
              className="pointer-events-none absolute left-4 top-1.5 text-[10px] font-semibold uppercase tracking-widest text-brand-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@team.com"
              autoComplete="email"
              required
              maxLength={254}
              className="w-full rounded-xl border border-white/10 bg-ink-900/60 px-4 pb-2 pt-6 text-base text-ink-50 outline-none transition-all duration-200 hover:border-white/20 focus:border-brand-500/60 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.12)]"
            />
          </div>

          <AnimatePresence>
            {error ? (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              >
                {error}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink-950" />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-ink-950"
                  style={{ animationDelay: "120ms" }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-ink-950"
                  style={{ animationDelay: "240ms" }}
                />
                <span className="ml-1.5">Sending…</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                Send reset link
                <svg
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            )}
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              aria-hidden
            />
          </button>
        </form>
      </motion.div>
    </div>
  )
}
