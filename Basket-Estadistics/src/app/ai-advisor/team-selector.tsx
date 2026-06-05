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
}: {
  onTeamChange: (team: TeamOption) => void
}) {
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<TeamOption | null>(null)
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
    <div className="w-full px-4 py-3" ref={wrapperRef}>
      <label className="block text-xs uppercase tracking-widest text-ink-400 mb-2">
        Seleccionar equipo
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={
            loading
              ? "Cargando equipos..."
              : "Buscar equipo (NBA, EuroLeague, ACB)..."
          }
          disabled={loading}
          className="w-full rounded-lg border border-ink-700 bg-ink-800/80 px-3 py-2.5 text-sm text-ink-50 placeholder-ink-400 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-40"
        />
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>

        {open && (
          <div
            id="team-options"
            role="listbox"
            aria-label="Equipos disponibles"
            className="absolute z-20 mt-1 w-full rounded-lg border border-ink-700 bg-ink-800 shadow-xl max-h-56 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-ink-400">
                No se encontraron equipos
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
                        : "text-ink-200 hover:bg-ink-700/50"
                    }`}
                  >
                    <span className="flex-1 truncate">{team.name}</span>
                    <span className="shrink-0 rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-ink-400">
                      {team.leagueSlug}
                    </span>
                    {isSelected && (
                      <svg
                        className="h-4 w-4 text-brand-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
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
