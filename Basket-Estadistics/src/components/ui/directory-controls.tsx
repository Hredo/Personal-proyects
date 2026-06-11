"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Fragment,
  Suspense,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import { isFebFilter, LEAGUE_FILTER_TREE } from "@/lib/league-groups"

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
      <div className="relative lg:flex-1">
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
          className="h-9 w-full rounded-full border border-hairline bg-white/[0.03] pl-10 pr-9 text-sm text-ink-50 outline-none transition duration-200 placeholder:text-ink-400 focus:border-brand-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-brand-500/20"
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

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterChip
          label="All"
          active={urlLeague === ""}
          onClick={() => apply({ league: null })}
        />
        {LEAGUE_FILTER_TREE.map((node) => {
          const expanded = !!node.children && isFebFilter(urlLeague)
          return (
            <Fragment key={node.slug}>
              <FilterChip
                label={node.label}
                hasChildren={!!node.children}
                expanded={expanded}
                active={
                  node.children
                    ? isFebFilter(urlLeague)
                    : urlLeague === node.slug
                }
                onClick={() => apply({ league: node.slug })}
              />
              {expanded
                ? node.children?.map((c) => (
                    <FilterChip
                      key={c.slug}
                      label={c.label}
                      sub
                      active={urlLeague === c.slug}
                      onClick={() => apply({ league: c.slug })}
                    />
                  ))
                : null}
            </Fragment>
          )
        })}
      </div>

      {kind === "coaches" ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {ROLES.map((r) => (
            <FilterChip
              key={r.value || "all"}
              label={r.label}
              active={urlRole === r.value}
              onClick={() => apply({ role: r.value || null })}
            />
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2 lg:ml-auto">
        <div className="relative">
          <select
            aria-label="Sort by"
            value={urlSort}
            onChange={(e) => apply({ sort: e.target.value })}
            className="h-9 appearance-none rounded-full border border-hairline bg-white/[0.03] pl-3.5 pr-8 text-xs font-semibold text-ink-100 outline-none transition duration-200 hover:border-hairline-strong focus:border-brand-400/50"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
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
        {kind !== "coaches" ? (
          <button
            type="button"
            onClick={() =>
              apply({ order: urlOrder === "asc" ? "desc" : "asc" })
            }
            aria-label={`Sort ${urlOrder === "asc" ? "descending" : "ascending"}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-white/[0.03] text-ink-200 transition-colors duration-200 hover:border-hairline-strong hover:text-ink-50"
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
          className={`ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500 lg:hidden ${
            isPending ? "text-brand-300" : ""
          }`}
        >
          {showing.toLocaleString("en-US")} / {total.toLocaleString("en-US")}
        </p>
      </div>
    </div>
  )
}

function defaultSort(kind: Props["kind"]): string {
  if (kind === "teams") return "name"
  if (kind === "coaches") return "name"
  return "points"
}

function FilterChip({
  label,
  active,
  hasChildren,
  expanded,
  sub,
  onClick,
}: {
  label: string
  active: boolean
  hasChildren?: boolean
  expanded?: boolean
  sub?: boolean
  onClick: () => void
}) {
  const inactiveStyle = sub
    ? "border-brand-500/25 bg-brand-500/[0.06] text-ink-200 hover:border-brand-400/50 hover:text-ink-50"
    : "border-hairline bg-white/[0.02] text-ink-300 hover:border-hairline-strong hover:text-ink-50"
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-expanded={hasChildren ? expanded : undefined}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ${
        active ? "border-brand-500 bg-brand-500 text-ink-950" : inactiveStyle
      }`}
    >
      {label}
      {hasChildren ? (
        <span
          aria-hidden
          className={`text-[9px] opacity-70 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      ) : null}
    </button>
  )
}
