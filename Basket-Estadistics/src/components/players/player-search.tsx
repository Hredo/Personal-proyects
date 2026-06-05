"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { SmartImage } from "@/components/ui/smart-image"

export type AutocompleteSort = "points" | "assists" | "rebounds" | "name"

type Season = {
  year: number
  name: string
  gamesPlayed: number
  points: number | null
  rebounds: number | null
  assists: number | null
  steals: number | null
  blocks: number | null
  fgPct: number | null
  threePct: number | null
  ftPct: number | null
}

type Result = {
  id: string
  slug: string
  fullName: string
  position: string | null
  nationality: string | null
  birthdate: string | null
  heightCm: number | null
  weightKg: number | null
  photoUrl: string | null
  team: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
  } | null
  league: { id: string; name: string; slug: string; country: string }
  season: Season | null
}

const LEAGUE_FILTERS = [
  { slug: "", label: "All leagues", accent: "from-brand-500 to-accent-cyan" },
  { slug: "nba", label: "NBA", accent: "from-brand-500 to-brand-300" },
  {
    slug: "euroleague",
    label: "EuroLeague",
    accent: "from-accent-cyan to-cyan-300",
  },
  { slug: "acb", label: "ACB", accent: "from-amber-400 to-orange-300" },
] as const

const SORT_OPTIONS: { value: AutocompleteSort; label: string }[] = [
  { value: "points", label: "Points" },
  { value: "assists", label: "Assists" },
  { value: "rebounds", label: "Rebounds" },
  { value: "name", label: "Name" },
]

const LEAGUE_BADGE: Record<string, string> = {
  nba: "bg-brand-500/15 text-brand-200 ring-brand-500/30",
  euroleague: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  acb: "bg-amber-500/10 text-amber-200 ring-amber-500/30",
}

function ageFrom(bd: string | null): number | null {
  if (!bd) return null
  const d = new Date(bd)
  if (Number.isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
}

function formatHeight(cm: number | null): string {
  if (cm == null) return "—"
  const totalIn = cm / 2.54
  const ft = Math.floor(totalIn / 12)
  const inches = Math.round(totalIn - ft * 12)
  return `${ft}'${inches}"`
}

function formatWeight(kg: number | null): string {
  if (kg == null) return "—"
  return `${kg} kg`
}

function formatPct(n: number | null): string {
  if (n == null) return "—"
  return `${(n * 100).toFixed(1)}%`
}

function formatNum(n: number | null, digits = 1): string {
  if (n == null) return "—"
  return n.toFixed(digits)
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export type PlayerSearchHandle = {
  open: () => void
  close: () => void
}

type PlayerSearchProps = {
  variant?: "inline" | "modal"
  autoFocus?: boolean
  onPick?: (slug: string) => void
  className?: string
  inputClassName?: string
  initialLeague?: string
  initialSort?: AutocompleteSort
  emptyHeadline?: string
}

type FetchPayload = {
  results: Result[]
  q: string
  league: string | null
  sort: AutocompleteSort
}

export const PlayerSearch = forwardRef<PlayerSearchHandle, PlayerSearchProps>(
  function PlayerSearch(
    {
      variant = "inline",
      autoFocus = false,
      onPick,
      className = "",
      inputClassName = "",
      initialLeague = "",
      initialSort = "points",
      emptyHeadline = "Top players this season",
    },
    ref,
  ) {
    const router = useRouter()
    const isModal = variant === "modal"

    const [q, setQ] = useState("")
    const [league, setLeague] = useState<string>(initialLeague)
    const [sort, setSort] = useState<AutocompleteSort>(initialSort)
    const [results, setResults] = useState<Result[]>([])
    const [loading, setLoading] = useState(false)
    const [activeIdx, setActiveIdx] = useState(-1)
    const [open, setOpen] = useState(false)
    const [isMac, setIsMac] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const abortRef = useRef<AbortController | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const requestIdRef = useRef(0)

    useEffect(() => {
      if (typeof window === "undefined") return
      setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
    }, [])

    useEffect(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      const myReq = ++requestIdRef.current

      if (q.trim().length < 1 && league === "" && sort === initialSort) {
        setResults([])
        setLoading(false)
        return
      }

      setLoading(true)
      debounceRef.current = setTimeout(() => {
        abortRef.current?.abort()
        const ctl = new AbortController()
        abortRef.current = ctl
        const params = new URLSearchParams()
        if (q.trim()) params.set("q", q.trim())
        if (league) params.set("league", league)
        if (sort !== "points") params.set("sort", sort)
        params.set("limit", isModal ? "16" : "10")
        fetch(`/api/players/search?${params.toString()}`, {
          signal: ctl.signal,
        })
          .then((r) => r.json())
          .then((data: FetchPayload) => {
            if (myReq !== requestIdRef.current) return
            setResults(data.results ?? [])
            setActiveIdx(-1)
            setLoading(false)
          })
          .catch((e: unknown) => {
            if (e instanceof Error && e.name === "AbortError") return
            if (myReq !== requestIdRef.current) return
            setLoading(false)
          })
      }, 180)
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
      }
    }, [q, league, sort, isModal, initialSort])

    useEffect(() => {
      if (!isModal) return
      function onDoc(e: MouseEvent) {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener("mousedown", onDoc)
      return () => document.removeEventListener("mousedown", onDoc)
    }, [isModal])

    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          setOpen(true)
          requestAnimationFrame(() => inputRef.current?.focus())
        },
        close: () => {
          setOpen(false)
        },
      }),
      [],
    )

    useEffect(() => {
      if (isModal) return
      function onDoc(e: MouseEvent) {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener("mousedown", onDoc)
      return () => document.removeEventListener("mousedown", onDoc)
    }, [isModal])

    const showDropdown = useMemo(() => {
      if (!open) return false
      if (q.trim().length > 0) return true
      return true
    }, [open, q])

    function pick(slug: string) {
      setOpen(false)
      setQ("")
      onPick?.(slug)
      router.push(`/players/${slug}`)
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        if (results.length > 0) {
          setActiveIdx((i) => (i < 0 ? 0 : (i + 1) % results.length))
          setOpen(true)
        }
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        if (results.length > 0) {
          setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1))
        }
        return
      }
      if (e.key === "Enter") {
        if (activeIdx >= 0 && results[activeIdx]) {
          e.preventDefault()
          pick(results[activeIdx].slug)
        }
        return
      }
      if (e.key === "Escape") {
        if (isModal) {
          setOpen(false)
        } else {
          setQ("")
          inputRef.current?.blur()
        }
      }
    }

    const hasQuery = q.trim().length > 0
    const showResults = !loading && results.length > 0
    const showEmpty = !loading && results.length === 0

    const content = (
      <div
        ref={containerRef}
        className={
          isModal
            ? `relative w-full ${className}`
            : `relative w-full ${className}`
        }
      >
        <SearchInput
          ref={inputRef}
          q={q}
          onChange={(v) => {
            setQ(v)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          loading={loading}
          isMac={isMac}
          inputClassName={inputClassName}
        />

        <AnimatePresence>
          {open && showDropdown ? (
            <motion.div
              initial={{ opacity: 0, y: isModal ? 12 : 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className={
                isModal
                  ? "mt-3 overflow-hidden rounded-2xl border border-white/10 bg-ink-950/95 shadow-2xl shadow-black/70 backdrop-blur-xl"
                  : "absolute left-0 right-0 z-50 mt-2 max-h-[75vh] overflow-hidden rounded-2xl border border-white/10 bg-ink-950/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
              }
            >
              <div
                aria-hidden
                className="pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-brand-500/60 to-transparent"
              />
              <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {LEAGUE_FILTERS.map((l) => {
                    const active = league === l.slug
                    return (
                      <button
                        key={l.slug || "all"}
                        type="button"
                        onClick={() => setLeague(l.slug)}
                        className={`relative rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                          active
                            ? "text-ink-950"
                            : "text-ink-200 hover:bg-white/5"
                        }`}
                      >
                        {active ? (
                          <span
                            className={`absolute inset-0 rounded-full bg-gradient-to-r ${l.accent}`}
                          />
                        ) : (
                          <span className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.03]" />
                        )}
                        <span className="relative">{l.label}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-ink-400">
                    Sort
                  </span>
                  <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
                    {SORT_OPTIONS.map((s) => {
                      const active = sort === s.value
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSort(s.value)}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
                            active
                              ? "bg-brand-500 text-ink-950"
                              : "text-ink-200 hover:text-ink-50"
                          }`}
                        >
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div
                className={
                  isModal
                    ? "max-h-[60vh] overflow-y-auto p-2"
                    : "max-h-[70vh] overflow-y-auto p-2"
                }
              >
                {loading && results.length === 0 ? (
                  <SkeletonList compact={!isModal} />
                ) : showEmpty ? (
                  <EmptyState
                    headline={
                      hasQuery
                        ? `No players match “${q.trim()}”`
                        : emptyHeadline
                    }
                    sub={
                      hasQuery
                        ? "Try a partial last name or relax the filters above."
                        : "Pick a league or change the sort to see different leaders."
                    }
                  />
                ) : showResults ? (
                  <ul ref={listRef} className="space-y-1">
                    {results.map((p, i) => (
                      <ResultCard
                        key={p.id}
                        player={p}
                        active={activeIdx === i}
                        onMouseEnter={() => setActiveIdx(i)}
                        onClick={() => pick(p.slug)}
                        compact={!isModal}
                      />
                    ))}
                  </ul>
                ) : null}
              </div>

              {isModal ? (
                <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-4 py-2 text-[10px] text-ink-400">
                  <div className="flex items-center gap-3">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd>
                    <span>navigate</span>
                    <Kbd>↵</Kbd>
                    <span>open</span>
                    <Kbd>esc</Kbd>
                    <span>close</span>
                  </div>
                  <span className="text-ink-500">
                    {results.length} result{results.length === 1 ? "" : "s"}
                  </span>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    )

    return content
  },
)

const SearchInput = forwardRef<
  HTMLInputElement,
  {
    q: string
    onChange: (v: string) => void
    onFocus: () => void
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
    autoFocus?: boolean
    loading: boolean
    isMac: boolean
    inputClassName: string
  }
>(function SearchInput(
  {
    q,
    onChange,
    onFocus,
    onKeyDown,
    autoFocus,
    loading,
    isMac,
    inputClassName,
  },
  ref,
) {
  return (
    <div className="relative">
      <svg
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400"
        fill="none"
        viewBox="0 0 24 24"
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
        ref={ref}
        type="search"
        value={q}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder="Search any player — try “Doncic”, “Real Madrid”…"
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        aria-label="Search players"
        aria-autocomplete="list"
        className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 pl-12 pr-32 text-base text-ink-50 placeholder:text-ink-400 outline-none ring-brand-500/50 transition focus:border-brand-400/60 focus:bg-white/[0.07] focus:ring-2 ${inputClassName}`}
      />
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {loading ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[10px] uppercase tracking-wider text-ink-400"
          >
            <Spinner />
          </motion.span>
        ) : (
          <kbd className="hidden items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-1 font-mono text-[10px] text-ink-300 sm:inline-flex">
            <span>{isMac ? "⌘" : "Ctrl"}</span>
            <span>K</span>
          </kbd>
        )}
      </div>
    </div>
  )
})

function ResultCard({
  player,
  active,
  onMouseEnter,
  onClick,
  compact,
}: {
  player: Result
  active: boolean
  onMouseEnter: () => void
  onClick: () => void
  compact: boolean
}) {
  return (
    <li>
      <motion.button
        type="button"
        role="option"
        aria-selected={active}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.12 }}
        className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-xl p-3 text-left transition ${
          active
            ? "bg-gradient-to-r from-brand-500/15 to-transparent ring-1 ring-brand-500/40"
            : "ring-1 ring-transparent hover:bg-white/[0.04] hover:ring-white/10"
        }`}
      >
        <div
          className={`relative shrink-0 overflow-hidden rounded-lg bg-court-800 ring-1 ring-white/10 ${
            compact ? "h-12 w-12" : "h-14 w-14"
          }`}
        >
          <SmartImage
            src={player.photoUrl}
            alt={player.fullName}
            fit="cover"
            className="transition duration-300 group-hover:scale-105"
            fallbackClassName="bg-gradient-to-br from-court-800 to-ink-900 text-xs font-bold text-brand-300"
            fallback={initials(player.fullName)}
          />
          {player.team?.logoUrl ? (
            <span className="absolute -bottom-1 -right-1 h-5 w-5 overflow-hidden rounded-full bg-ink-950 ring-2 ring-ink-950">
              <SmartImage
                src={player.team.logoUrl}
                alt={player.team.name}
                fit="cover"
                fallbackClassName="text-[7px] font-bold text-brand-300"
                fallback={initials(player.team.name)}
              />
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink-50">
              {player.fullName}
            </p>
            <span
              className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 sm:inline-flex ${
                LEAGUE_BADGE[player.league.slug] ??
                "bg-white/5 text-ink-200 ring-white/10"
              }`}
            >
              {player.league.name}
            </span>
          </div>
          <p className="truncate text-xs text-ink-300">
            {player.team?.name ?? "Free agent"}
          </p>
          <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-ink-400">
            {player.position ?? "—"} · {player.nationality ?? "—"} ·{" "}
            {formatHeight(player.heightCm)} · {formatWeight(player.weightKg)}
            {ageFrom(player.birthdate) != null
              ? ` · ${ageFrom(player.birthdate)} y.o.`
              : ""}
          </p>
        </div>

        {player.season ? (
          <div
            className={`hidden shrink-0 gap-x-3 gap-y-1 font-mono text-right sm:grid ${
              compact ? "text-[10px]" : "text-[11px]"
            }`}
            style={{ gridTemplateColumns: "auto auto auto auto" }}
          >
            <Stat
              label="PPG"
              value={formatNum(player.season.points)}
              highlight
            />
            <Stat label="RPG" value={formatNum(player.season.rebounds)} />
            <Stat label="APG" value={formatNum(player.season.assists)} />
            <Stat label="SPG" value={formatNum(player.season.steals)} />
            <Stat label="BPG" value={formatNum(player.season.blocks)} />
            <Stat label="FG%" value={formatPct(player.season.fgPct)} />
            <Stat label="3P%" value={formatPct(player.season.threePct)} />
            <Stat label="FT%" value={formatPct(player.season.ftPct)} />
          </div>
        ) : (
          <span className="hidden shrink-0 text-[10px] uppercase tracking-wider text-ink-500 sm:inline">
            No data
          </span>
        )}

        <svg
          aria-hidden
          className={`hidden h-4 w-4 shrink-0 text-ink-400 transition group-hover:text-brand-300 sm:block ${
            active ? "text-brand-300" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
    </li>
  )
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-ink-500">
        {label}
      </p>
      <p
        className={`font-semibold ${highlight ? "text-brand-300" : "text-ink-100"}`}
      >
        {value}
      </p>
    </div>
  )
}

function SkeletonList({ compact }: { compact: boolean }) {
  return (
    <ul className="space-y-1">
      {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
        <li
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-xl p-3"
        >
          <div className="h-12 w-12 shrink-0 rounded-lg bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-white/5" />
            <div className="h-2 w-1/2 rounded bg-white/5" />
            <div className="h-2 w-2/3 rounded bg-white/5" />
          </div>
          <div className="hidden grid-cols-3 gap-x-3 sm:grid">
            <div className="h-6 w-10 rounded bg-white/5" />
            <div className="h-6 w-10 rounded bg-white/5" />
            <div className="h-6 w-10 rounded bg-white/5" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyState({ headline, sub }: { headline: string; sub: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-semibold text-ink-100">{headline}</p>
      <p className="mt-1 text-xs text-ink-400">{sub}</p>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-300">
      {children}
    </kbd>
  )
}

function Spinner() {
  return (
    <motion.span
      aria-hidden
      className="inline-block h-3 w-3 rounded-full border border-brand-400 border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
  )
}

export function usePlayerSearch() {
  const ref = useRef<PlayerSearchHandle>(null)
  const open = useCallback(() => ref.current?.open(), [])
  const close = useCallback(() => ref.current?.close(), [])
  return { ref, open, close }
}
