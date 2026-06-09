import type { ReactNode } from "react"
import { cn } from "@/components/ui/cn"

export function AccountSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "gh-card rounded-2xl border border-hairline bg-surface-1/60 p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-ink-50 sm:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-ink-400">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  error?: string | null
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-semibold uppercase tracking-widest text-ink-400"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-300">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-white/10 bg-ink-900/60 px-3.5 py-2.5 text-sm text-ink-50 outline-none transition-all duration-200 placeholder:text-ink-600 hover:border-white/20 focus:border-brand-500/60 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.12)] disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full appearance-none rounded-xl border border-white/10 bg-ink-900/60 px-3.5 py-2.5 text-sm text-ink-50 outline-none transition-all duration-200 hover:border-white/20 focus:border-brand-500/60 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-100">{label}</p>
        {description ? (
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 disabled:opacity-50",
          checked
            ? "border-brand-400/50 bg-brand-500/80"
            : "border-white/10 bg-white/[0.06]",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-ink-50 shadow transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  )
}

export function StatusNote({
  type,
  children,
}: {
  type: "success" | "error" | "info"
  children: ReactNode
}) {
  const styles: Record<typeof type, string> = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    error: "border-red-500/30 bg-red-500/10 text-red-200",
    info: "border-brand-500/25 bg-brand-500/8 text-brand-100",
  }
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-[13px] leading-relaxed",
        styles[type],
      )}
      role={type === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  )
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}
