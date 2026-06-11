"use client"

import { useCallback, useEffect, useState } from "react"

type RowCounts = Record<string, number>

type LeagueStat = {
  slug: string
  name: string
  players: number
  teams: number
  seasons: number
  stat_rows: number
}

type SyncRecord = {
  id: number
  source: string
  status: string
  rows_written: number
  started_at: string
  finished_at: string | null
  error: string | null
}

type NullStats = Record<string, number>

type SeasonStat = {
  slug: string
  season: string
  n: number
}

type Stats = {
  rowCounts: RowCounts
  leaguesStats: LeagueStat[]
  lastSync: SyncRecord[]
  nulls: NullStats
  seasonStats: SeasonStat[]
}

type UserRow = {
  id: string
  email: string
  name: string
  plan: string
  role: string
  createdAt: string
}

type Toast = { message: string; type: "success" | "error" } | null

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <h2 className="mb-4 font-display text-lg font-bold text-ink-50">{title}</h2>
      {children}
    </section>
  )
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/[0.04] ${className}`} />
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-bold text-ink-50">{value}</p>
    </div>
  )
}

function Badge({ variant }: { variant: string }) {
  const styles: Record<string, string> = {
    ok: "bg-positive/15 text-positive border-positive/30",
    failed: "bg-ember-500/15 text-ember-300 border-ember-500/30",
    running: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  }
  const s = styles[variant] ?? styles.failed
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s}`}>
      {variant}
    </span>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleString()
}

function ToastMessage({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [toast, onClose])

  if (!toast) return null
  const bg = toast.type === "success" ? "bg-positive/20 border-positive/40 text-positive" : "bg-ember-500/20 border-ember-500/40 text-ember-300"
  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 text-sm font-medium shadow-xl backdrop-blur-md ${bg}`}>
      {toast.message}
    </div>
  )
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserRow[] | null>(null)
  const [syncHistory, setSyncHistory] = useState<SyncRecord[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type })
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats")
      if (res.ok) setStats(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) setUsers(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchSyncHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sync")
      if (res.ok) setSyncHistory(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    Promise.all([fetchStats(), fetchUsers(), fetchSyncHistory()]).finally(() => setLoading(false))
  }, [fetchStats, fetchUsers, fetchSyncHistory])

  const promoteSelf = async () => {
    const res = await fetch("/api/admin/promote", { method: "POST" })
    if (res.ok) {
      showToast("Account promoted to admin in database", "success")
      fetchUsers()
    } else {
      showToast("Failed to promote", "error")
    }
  }

  const runSync = async (source: string) => {
    setSyncing(source)
    try {
      const res = await fetch("/api/admin/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      })
      if (res.ok) {
        showToast(`${source} sync completed`, "success")
        fetchStats()
        fetchSyncHistory()
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        showToast(`${source} sync failed: ${err.error}`, "error")
      }
    } catch {
      showToast(`${source} sync failed (network error)`, "error")
    } finally {
      setSyncing(null)
    }
  }

  const updateUser = async (userId: string, field: "role" | "plan", value: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, [field]: value }),
    })
    if (res.ok) {
      showToast("User updated", "success")
      fetchUsers()
    } else {
      showToast("Failed to update user", "error")
    }
  }

  const revalidateTag = async (tag: string) => {
    const res = await fetch("/api/admin/cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    })
    if (res.ok) {
      showToast(`Cache tag "${tag}" revalidated`, "success")
    } else {
      showToast(`Failed to revalidate "${tag}"`, "error")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const hasDbRole = users?.find((u) => u.role === "admin")

  return (
    <>
      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      {/* Self-promote banner */}
      {!hasDbRole && (
        <div className="flex items-center justify-between rounded-xl border border-brand-500/30 bg-brand-500/10 px-5 py-4">
          <div>
            <p className="font-semibold text-ink-50">Admin role not set in database</p>
            <p className="mt-0.5 text-sm text-ink-400">
              Your account is treated as admin via code override. Click to persist the role.
            </p>
          </div>
          <button type="button" onClick={promoteSelf} className="gh-sheen rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-brand-400">
            Promote to Admin
          </button>
        </div>
      )}

      {/* Database Stats */}
      <Section title="Database Overview" id="stats">
        {stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(stats.rowCounts).map(([k, v]) => (
                <StatCard key={k} label={k.replace(/_/g, " ")} value={v.toLocaleString()} />
              ))}
            </div>
            {stats.leaguesStats.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-ink-400">
                      <th className="pb-2 pr-4 font-medium">League</th>
                      <th className="pb-2 pr-4 font-medium">Players</th>
                      <th className="pb-2 pr-4 font-medium">Teams</th>
                      <th className="pb-2 pr-4 font-medium">Seasons</th>
                      <th className="pb-2 font-medium">Stat Rows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.leaguesStats.map((l) => (
                      <tr key={l.slug} className="border-b border-white/[0.03] text-ink-200">
                        <td className="py-2 pr-4 font-medium text-ink-50">{l.name}</td>
                        <td className="py-2 pr-4 font-mono">{l.players}</td>
                        <td className="py-2 pr-4 font-mono">{l.teams}</td>
                        <td className="py-2 pr-4 font-mono">{l.seasons}</td>
                        <td className="py-2 font-mono">{l.stat_rows}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {stats.seasonStats.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-ink-300 transition hover:text-ink-50">
                  Stats per league / season
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-ink-400">
                        <th className="pb-2 pr-4 font-medium">League</th>
                        <th className="pb-2 pr-4 font-medium">Season</th>
                        <th className="pb-2 font-medium">Rows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.seasonStats.map((s, i) => (
                        <tr key={i} className="border-b border-white/[0.03] text-ink-200">
                          <td className="py-1.5 pr-4">{s.slug}</td>
                          <td className="py-1.5 pr-4">{s.season}</td>
                          <td className="py-1.5 font-mono">{s.n}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
            {stats.nulls && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-ink-300 transition hover:text-ink-50">
                  Data quality (null fields)
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(stats.nulls).map(([k, v]) => (
                    <StatCard key={k} label={k.replace(/_/g, " ")} value={v} />
                  ))}
                </div>
              </details>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-400">Failed to load stats.</p>
        )}
      </Section>

      {/* Sync Management */}
      <Section title="Sync Management" id="sync">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["nba", "euroleague", "acb", "leb-oro", "leb-plata", "eba"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runSync(s)}
                disabled={syncing === s}
                className="gh-sheen rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-ink-200 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-ink-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {syncing === s ? "Syncing..." : `Sync ${s}`}
              </button>
            ))}
          </div>
          {syncHistory && syncHistory.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-ink-400">
                    <th className="pb-2 pr-3 font-medium">Source</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Rows</th>
                    <th className="pb-2 pr-3 font-medium">Started</th>
                    <th className="pb-2 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {syncHistory.slice(0, 20).map((r) => (
                    <tr key={r.id} className="border-b border-white/[0.03] text-ink-200">
                      <td className="py-1.5 pr-3 font-medium text-ink-50">{r.source}</td>
                      <td className="py-1.5 pr-3"><Badge variant={r.status} /></td>
                      <td className="py-1.5 pr-3 font-mono">{r.rows_written}</td>
                      <td className="py-1.5 pr-3 text-xs">{formatDate(r.started_at)}</td>
                      <td className="max-w-[200px] truncate py-1.5 text-xs text-ember-400">{r.error ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button type="button" onClick={fetchSyncHistory} className="text-xs text-ink-400 hover:text-ink-50 transition">
            Refresh history
          </button>
        </div>
      </Section>

      {/* Cache Management */}
      <Section title="Cache Management" id="cache">
        <div className="flex flex-wrap gap-2">
          {["teams", "players", "player-season-stats", "leagues", "seasons", "coaches"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => revalidateTag(tag)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-ink-200 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-ink-50"
            >
              Revalidate {tag}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Revalidates Next.js data cache for the selected tag. Changes will be reflected on next page load.
        </p>
      </Section>

      {/* User Management */}
      <Section title="User Management" id="users">
        {users && users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-ink-400">
                  <th className="pb-2 pr-3 font-medium">Name</th>
                  <th className="pb-2 pr-3 font-medium">Email</th>
                  <th className="pb-2 pr-3 font-medium">Role</th>
                  <th className="pb-2 pr-3 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.03] text-ink-200">
                    <td className="py-2 pr-3 font-medium text-ink-50">{u.name}</td>
                    <td className="py-2 pr-3 text-xs">{u.email}</td>
                    <td className="py-2 pr-3">
                      <select
                        value={u.role}
                        onChange={(e) => updateUser(u.id, "role", e.target.value)}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-ink-200"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={u.plan}
                        onChange={(e) => updateUser(u.id, "plan", e.target.value)}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-ink-200"
                      >
                        <option value="free">free</option>
                        <option value="pro">pro</option>
                      </select>
                    </td>
                    <td className="py-2 text-xs text-ink-400">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-400">No users found.</p>
        )}
      </Section>
    </>
  )
}
