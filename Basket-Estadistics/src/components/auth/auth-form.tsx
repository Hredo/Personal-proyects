"use client"

import { useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthCourt, type AuthCourtStats } from "@/components/auth/auth-court"
import { safeNextPath } from "@/lib/auth/safe-redirect"

type FieldProps = {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  minLength?: number
  maxLength?: number
  hint?: string
  error?: string | null
  children?: React.ReactNode
}

function FloatingField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
  maxLength,
  hint,
  error,
  children,
}: FieldProps) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0
  const float = focused || filled
  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 origin-left transition-all duration-200 ${
          float
            ? "top-1.5 text-[10px] font-semibold uppercase tracking-widest text-brand-300"
            : "top-1/2 -translate-y-1/2 text-sm text-ink-400"
        }`}
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={float ? placeholder : ""}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full rounded-xl border bg-ink-900/60 px-4 pb-2 pt-6 text-base text-ink-50 outline-none transition-all duration-200 ${
          error
            ? "border-red-500/60 focus:border-red-400"
            : focused
              ? "border-brand-500/60 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]"
              : "border-white/10 hover:border-white/20"
        }`}
      />
      {children}
      <AnimatePresence>
        {error ? (
          <motion.p
            key="err"
            id={`${id}-error`}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            className="mt-1.5 text-xs text-red-300"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            id={`${id}-hint`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-[11px] text-ink-500"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

type Strength = 0 | 1 | 2 | 3

function passwordStrength(pw: string): {
  score: Strength
  label: string
  color: string
} {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (pw.length >= 12) score++
  const clamped = Math.min(3, score) as Strength
  const meta: Record<Strength, { label: string; color: string }> = {
    0: { label: "Too short", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-red-500" },
    2: { label: "OK", color: "bg-amber-500" },
    3: { label: "Strong", color: "bg-emerald-500" },
  }
  return { score: clamped, ...meta[clamped] }
}

export type AuthFormVariant = "login" | "register"

type AuthFormProps = {
  variant: AuthFormVariant
  stats: AuthCourtStats
}

export function AuthForm({ variant, stats }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNextPath(searchParams.get("next"))

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const isRegister = variant === "register"
  const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login"
  const strength = passwordStrength(password)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setFormError(null)
    setFieldErrors({})

    const localErrors: Record<string, string> = {}
    if (isRegister) {
      if (name.trim().length < 2) localErrors.name = "Name must be at least 2 characters."
      if (password !== confirm && confirm.length > 0) {
        localErrors.confirm = "Passwords do not match."
      }
    }
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      setSubmitting(false)
      return
    }

    try {
      const body: Record<string, string> = {
        email: email.trim(),
        password,
        website: honeypot,
      }
      if (isRegister) body.name = name.trim()

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          typeof payload?.error === "string"
            ? payload.error
            : "We couldn't sign you in. Please try again."
        if (msg.toLowerCase().includes("password")) {
          setFieldErrors({ password: msg })
        } else if (msg.toLowerCase().includes("email")) {
          setFieldErrors({ email: msg })
        } else if (msg.toLowerCase().includes("name")) {
          setFieldErrors({ name: msg })
        } else {
          setFormError(msg)
        }
        return
      }
      // Tell the navbar (UserMenu) the session changed so it swaps
      // "Sign in / Get started" for the account menu without a reload.
      window.dispatchEvent(new Event("auth:changed"))
      router.refresh()
      router.push(next)
    } catch {
      setFormError("We couldn't reach the server. Check your connection and retry.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh w-full bg-ink-950">
      <div className="flex w-full flex-col lg:w-[42%] xl:w-[40%]">
        <div className="flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-300 transition hover:text-ink-50"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <Link
            href={isRegister ? "/login" : "/register"}
            className="text-sm text-ink-300 transition hover:text-ink-50"
          >
            {isRegister ? "I already have an account" : "Create an account"}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <h1 className="font-display text-3xl font-bold text-ink-50 sm:text-4xl">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-300 sm:text-base">
              {isRegister
                ? "20 seconds, no credit card. Free accounts get one preview chat to try the advisor and the AI compare."
                : "Sign in to keep chatting with the advisor and unlock unlimited AI comparisons."}
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

              {isRegister ? (
                <FloatingField
                  id="name"
                  label="Your name"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Hugo Redondo"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={60}
                  error={fieldErrors.name}
                />
              ) : null}

              <FloatingField
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@team.com"
                autoComplete="email"
                required
                maxLength={254}
                error={fieldErrors.email}
              />

              <div>
                <FloatingField
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                  minLength={isRegister ? 8 : 1}
                  maxLength={200}
                  error={fieldErrors.password}
                >
                  {isRegister ? (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex flex-1 gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                              strength.score > i ? strength.color : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-ink-500">
                        {strength.label}
                      </span>
                    </div>
                  ) : null}
                </FloatingField>
              </div>

              {isRegister ? (
                <FloatingField
                  id="confirm"
                  label="Repeat password"
                  type="password"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={200}
                  error={fieldErrors.confirm}
                />
              ) : null}

              <AnimatePresence>
                {formError ? (
                  <motion.div
                    key="form-err"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                  >
                    {formError}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <button
                type="submit"
                disabled={submitting}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <AnimatePresence mode="wait">
                  {submitting ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="inline-flex items-center gap-2"
                    >
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ink-950" />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-ink-950"
                        style={{ animationDelay: "120ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-ink-950"
                        style={{ animationDelay: "240ms" }}
                      />
                      <span className="ml-1.5">
                        {isRegister ? "Creating account…" : "Signing in…"}
                      </span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="inline-flex items-center gap-2"
                    >
                      {isRegister ? "Create account" : "Sign in"}
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12h14M13 6l6 6-6 6"
                        />
                      </svg>
                    </motion.span>
                  )}
                </AnimatePresence>
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  aria-hidden
                />
              </button>

              <p className="text-center text-xs text-ink-500">
                By continuing you agree to our{" "}
                <Link
                  href="/terms"
                  className="underline decoration-ink-700 underline-offset-2 transition hover:text-ink-300"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline decoration-ink-700 underline-offset-2 transition hover:text-ink-300"
                >
                  Privacy Policy
                </Link>
                . Your data is encrypted in transit (HTTPS) and at rest.
              </p>
            </form>
          </motion.div>
        </div>
      </div>

      <div className="relative hidden lg:block lg:w-[58%] xl:w-[60%]">
        <AuthCourt className="h-full w-full" stats={stats} />
      </div>
    </div>
  )
}

export default AuthForm
