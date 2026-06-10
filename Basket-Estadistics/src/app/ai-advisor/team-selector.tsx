"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { TeamOption } from "@/types/teams"

const TEAMS_CACHE_KEY = "ai-advisor:teams-cache"
const TEAMS_CACHE_TTL_MS = 10 * 60 * 1000 // 10 min

type CachedTeams = { ts: number; data: TeamOption[] }

function loadCachedTeams(): TeamOption[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(TEAMS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedTeams
    if (
      parsed &&
      Array.isArray(parsed.data) &&
      Date.now() - parsed.ts < TEAMS_CACHE_TTL_MS
    ) {
      return parsed.data
    }
  } catch {}
  return null
}

function storeCachedTeams(data: TeamOption[]): void {
  if (typeof window === "undefined") return
  try {
    const payload: CachedTeams = { ts: Date.now(), data }
    window.sessionStorage.setItem(TEAMS_CACHE_KEY, JSON.stringify(payload))
  } catch {}
}

export function TeamSelector({
  onTeamChange,
  initialTeam,
}: {
  onTeamChange: (team: TeamOption) => void
  initialTeam?: TeamOption | null
}) {
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<TeamOption | null>(
    initialTeam ?? null,
  )
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cached = loadCachedTeams()
    if (cached) {
      setTeams(cached)
      setLoading(false)
      return
    }
    let cancelled = false
    fetch("/api/teams/options")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data)) {
          setTeams(data)
          storeCachedTeams(data)
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = query.trim()
    ? teams.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.leagueSlug.toLowerCase().includes(query.toLowerCase()),
      )
    : teams

  const handleSelect = useCallback(
    (team: TeamOption) => {
      setSelected(team)
      setQuery(team.name)
      setOpen(false)
      onTeamChange(team)
    },
    [onTeamChange],
  )

  useEffect(() => {
    function handlePointer(e: MouseEvent | TouchEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handlePointer)
    document.addEventListener("touchstart", handlePointer)
    return () => {
      document.removeEventListener("mousedown", handlePointer)
      document.removeEventListener("touchstart", handlePointer)
    }
  }, [])

  useEffect(() => {
    setHighlightIdx(-1)
  }, [query])

  useEffect(() => {
    if (initialTeam) {
      setSelected(initialTeam)
      setQuery(initialTeam.name)
    }
  }, [initialTeam])

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true)
        e.preventDefault()
      }
      return
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightIdx((prev) => Math.min(prev + 1, filtered.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightIdx((prev) => Math.max(prev - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (highlightIdx >= 0 && filtered[highlightIdx]) {
          handleSelect(filtered[highlightIdx])
        }
        break
      case "Escape":
        setOpen(false)
        break
    }
  }

  return (
    <div className="w-full px-4 py-3 sm:px-5" ref={wrapperRef}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label
          htmlFor="team-selector-input"
          className="block text-xs font-semibold uppercase tracking-widest text-ink-400"
        >
          1 · Select a team
        </label>
        {selected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {selected.name}
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-widest text-ink-500">
            Required to start
          </span>
        )}
      </div>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-4.3-4.3M16.65 10.65a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
          />
        </svg>
        <input
          ref={inputRef}
          id="team-selector-input"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="team-options"
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={
            loading
              ? "Loading teams…"
              : "Search for a team — NBA, EuroLeague, ACB…"
          }
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
          className="w-full cursor-text rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-16 text-sm text-ink-50 outline-none transition placeholder:text-ink-400 hover:border-white/20 focus:border-brand-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-brand-500/25 disabled:cursor-wait disabled:opacity-40"
        />
        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setOpen(true)
                inputRef.current?.focus()
              }}
              aria-label="Clear team search"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-400 transition hover:bg-white/10 hover:text-ink-50"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          ) : null}
          <svg
            className={`pointer-events-none h-4 w-4 text-ink-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {open && (
          <div
            id="team-options"
            role="listbox"
            aria-label="Available teams"
            className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/50"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-ink-400">
                No teams found
              </div>
            ) : (
              filtered.map((team, i) => {
                const isSelected = selected?.id === team.id;
                const isHighlighted = i === highlightIdx;
                return (
                  <button
                    key={team.id}
                    id={`team-option-${team.id}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(team)}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                      isHighlighted
                        ? "bg-brand-500/20 text-ink-50"
                        : isSelected
                        ? "bg-brand-500/10 text-brand-300"
                        : "text-ink-200 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="flex-1 truncate">{team.name}</span>
                    <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      {team.leagueSlug}
                    </span>
                    {isSelected && (
                      <svg
                        className="h-4 w-4 text-brand-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
