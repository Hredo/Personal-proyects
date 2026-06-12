"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { LEAGUE_FILTER_TREE } from "@/lib/league-groups"

const SORTS_PLAYERS = [
  { value: "points", label: "Points" },
  { value: "rebounds", label: "Rebounds" },
  { value: "assists", label: "Assists" },
  { value: "name", label: "Name" },
] as const

const SORTS_TEAMS = [
  { value: "name", label: "Name" },
  { value: "players", label: "Roster size" },
] as const

const ROLES = [
  { value: "", label: "All" },
  { value: "head_coach", label: "Head coach" },
  { value: "assistant_coach", label: "Assistant" },
  { value: "staff", label: "Staff" },
] as const

type Props = {
  basePath: string
  kind: "players" | "teams" | "coaches"
  total: number
  showing: number
}

export function DirectoryControls({ basePath, kind, total, showing }: Props) {
  return (
    <Suspense
      fallback={
        <div className="h-9 w-full animate-pulse rounded-full bg-white/[0.03]" />
      }
    >
      <DirectoryControlsInner
        basePath={basePath}
        kind={kind}
        total={total}
        showing={showing}
      />
    </Suspense>
  )
}

function DirectoryControlsInner({ basePath, kind, total, showing }: Props) {
  const router = useRouter()
  const search = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const urlLeague = search.get("league") ?? ""
  const urlSort = search.get("sort") ?? defaultSort(kind)
  const urlOrder = search.get("order") ?? "desc"
  const urlRole = search.get("role") ?? ""
  const q = search.get("q") ?? ""

  const sorts = kind === "teams" ? SORTS_TEAMS : SORTS_PLAYERS

  // The search box keeps its own state so typing never depends on a round-trip
  // to the URL. We debounce the navigation and only mirror the URL back into the
  // box when it changes for some *other* reason (back/forward, a filter reset),
  // guarded by `lastPushed` so an in-flight navigation can't clobber characters
  // typed during the debounce window.
  const [text, setText] = useState(q)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPushed = useRef(q)

  useEffect(() => {
    if (q !== lastPushed.current) {
      lastPushed.current = q
      setText(q)
    }
  }, [q])

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    [],
  )

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(search.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k)
      else params.set(k, v)
    }
    params.delete("page")
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false })
    })
  }

  function onSearchChange(value: string) {
    setText(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      lastPushed.current = value
      apply({ q: value || null })
    }, 300)
  }

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setText("")
    lastPushed.current = ""
    apply({ q: null })
  }

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
      <div className="relative w-full lg:max-w-72">
        <svg
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-4.3-4.3M16.65 10.65a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
          />
        </svg>
        <input
          type="text"
          inputMode="search"
          value={text}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            kind === "players"
              ? "Search players…"
              : kind === "teams"
                ? "Search teams…"
                : "Search coaches…"
          }
          aria-label="Search"
          autoComplete="off"
          spellCheck={false}
          className="h-9 w-full rounded-full border border-hairline bg-surface-1/60 pl-10 pr-9 text-sm text-ink-50 outline-none transition duration-200 placeholder:text-ink-400 focus:border-brand-400/50 focus:bg-surface-2/60 focus:ring-2 focus:ring-brand-500/20"
        />
        {text ? (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition hover:bg-white/10 hover:text-ink-50"
          >
            <svg
              aria-hidden
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 lg:ml-auto">
        <LeagueSelect
          value={urlLeague}
          onChange={(v) => apply({ league: v || null })}
        />

        {kind === "coaches" ? (
          <SelectControl
            ariaLabel="Filter by role"
            value={urlRole}
            onChange={(v) => apply({ role: v || null })}
          >
            {ROLES.map((r) => (
              <option key={r.value || "all"} value={r.value}>
                {r.label}
              </option>
            ))}
          </SelectControl>
        ) : null}

        <SelectControl
          ariaLabel="Sort by"
          value={urlSort}
          onChange={(v) => apply({ sort: v })}
        >
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              Sort: {s.label}
            </option>
          ))}
        </SelectControl>

        {kind !== "coaches" ? (
          <button
            type="button"
            onClick={() =>
              apply({ order: urlOrder === "asc" ? "desc" : "asc" })
            }
            aria-label={`Sort ${urlOrder === "asc" ? "descending" : "ascending"}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-1/60 text-ink-200 transition-colors duration-200 hover:border-hairline-strong hover:bg-surface-2/60 hover:text-ink-50"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform duration-300 ease-fluid ${urlOrder === "asc" ? "rotate-180" : ""}`}
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        ) : null}
        <p
          className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500 lg:hidden ${
            isPending ? "text-brand-300" : ""
          }`}
        >
          {showing.toLocaleString("en-US")} / {total.toLocaleString("en-US")}
        </p>
      </div>
    </div>
  )
}

function flattenLeagueOptions() {
  const items: { value: string; label: string; depth: number }[] = [
    { value: "", label: "All leagues", depth: 0 },
  ]
  for (const node of LEAGUE_FILTER_TREE) {
    if (node.children) {
      items.push({ value: node.slug, label: `All ${node.label}`, depth: 0 })
      for (const child of node.children) {
        items.push({ value: child.slug, label: child.label, depth: 1 })
      }
    } else {
      items.push({ value: node.slug, label: node.label, depth: 0 })
    }
  }
  return items
}

function LeagueSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const options = useMemo(() => flattenLeagueOptions(), [])
  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? "All leagues"

  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(q))
  }, [search, options])

  const close = useCallback(() => {
    setOpen(false)
    setSearch("")
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [close])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Filter by league"
        className="flex h-9 min-w-[130px] items-center gap-1.5 rounded-full border border-hairline bg-surface-1/80 px-3.5 text-xs font-semibold text-ink-50 outline-none transition duration-200 hover:border-hairline-strong hover:bg-surface-2/80"
      >
        <svg
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 text-brand-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v4M22 12h-4M12 18v4M6 12H2" />
        </svg>
        <span className="truncate">{selectedLabel}</span>
        <svg
          aria-hidden
          className={`ml-auto h-3 w-3 shrink-0 text-ink-400 transition-transform duration-300 ease-fluid ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Leagues"
          className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-2xl border border-hairline bg-surface-2/95 p-1.5 shadow-[var(--shadow-court)] backdrop-blur-xl"
        >
          <div className="relative mb-1">
            <svg
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21 21-4.3-4.3M16.65 10.65a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leagues…"
              aria-label="Search leagues"
              className="h-8 w-full rounded-xl border border-hairline bg-surface-0/80 pl-8 pr-2.5 text-xs text-ink-50 outline-none placeholder:text-ink-400"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value)
                  close()
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-200 ${
                  opt.value === value
                    ? "bg-brand-500/15 text-brand-200"
                    : "text-ink-200 hover:bg-white/[0.05] hover:text-ink-50"
                }`}
                style={{ paddingLeft: opt.depth > 0 ? "2rem" : "0.625rem" }}
              >
                {opt.depth === 0 && opt.value !== "" ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500/70" />
                ) : opt.depth > 0 ? (
                  <span className="h-1 w-1 shrink-0 rounded-full bg-brand-500/50" />
                ) : null}
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-2.5 py-3 text-center text-xs text-ink-400">
                No leagues found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SelectControl({
  ariaLabel,
  value,
  onChange,
  className = "",
  children,
}: {
  ariaLabel: string
  value: string
  onChange: (value: string) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-full border border-hairline bg-surface-1/80 pl-3.5 pr-8 text-xs font-semibold text-ink-50 outline-none transition duration-200 hover:border-hairline-strong hover:bg-surface-2/80 focus:border-brand-400/50"
      >
        {children}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}

function defaultSort(kind: Props["kind"]): string {
  if (kind === "teams") return "name"
  if (kind === "coaches") return "name"
  return "points"
}
