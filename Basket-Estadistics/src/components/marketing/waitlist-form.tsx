"use client"

import { useId, useState } from "react"

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok"; dedup: boolean }
  | { kind: "error"; message: string }

export function WaitlistForm({ source = "pricing" }: { source?: string }) {
  const id = useId()
  const [email, setEmail] = useState("")
  const [hp, setHp] = useState("")
  const [status, setStatus] = useState<Status>({ kind: "idle" })

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status.kind === "submitting") return
    setStatus({ kind: "submitting" })
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source, hp }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        dedup?: boolean
      }
      if (!res.ok || !data.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "Could not join. Please try again.",
        })
        return
      }
      setStatus({ kind: "ok", dedup: Boolean(data.dedup) })
      setEmail("")
    } catch {
      setStatus({
        kind: "error",
        message: "Network error. Please try again.",
      })
    }
  }

  if (status.kind === "ok") {
    return (
      <div
        className="mx-auto mt-6 max-w-md rounded-xl border border-brand-500/30 bg-brand-500/10 p-4 text-center"
        role="status"
      >
        <p className="font-display text-sm font-semibold text-brand-200 sm:text-base">
          {status.dedup ? "You're already on the list." : "You're on the list."}
        </p>
        <p className="mt-1 text-xs text-ink-300 sm:text-sm">
          We&apos;ll email you when the Pro tier opens.
        </p>
      </div>
    )
  }

  return (
    <form
      id="waitlist-form"
      onSubmit={onSubmit}
      className="mx-auto mt-6 flex w-full max-w-md flex-col gap-2 sm:flex-row"
      noValidate
    >
      <label htmlFor={`${id}-email`} className="sr-only">
        Email address
      </label>
      <input
        id={`${id}-email`}
        name="email"
        type="email"
        required
        inputMode="email"
        autoComplete="email"
        placeholder="you@team.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status.kind === "submitting"}
        aria-invalid={status.kind === "error" ? true : undefined}
        aria-describedby={status.kind === "error" ? `${id}-error` : undefined}
        className="w-full flex-1 rounded-md border border-white/10 bg-ink-900/80 px-4 py-3 text-sm text-ink-50 placeholder:text-ink-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:text-base"
      />
      <input
        type="text"
        name="hp"
        tabIndex={-1}
        autoComplete="off"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="hidden"
        aria-hidden
      />
      <button
        type="submit"
        disabled={status.kind === "submitting" || email.length === 0}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-5 py-3 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
      >
        {status.kind === "submitting" ? "Joining…" : "Join the waitlist"}
      </button>
      {status.kind === "error" ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-center text-xs text-accent-magenta sm:absolute sm:mt-0 sm:translate-y-12"
        >
          {status.message}
        </p>
      ) : null}
    </form>
  )
}
