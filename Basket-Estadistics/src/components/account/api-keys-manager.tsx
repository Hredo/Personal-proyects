"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AccountSection,
  Field,
  Select,
  StatusNote,
  TextInput,
} from "@/components/account/primitives"
import {
  AI_PROVIDERS,
  getProvider,
  providersForFeature,
  resolveModel,
  type AiFeature,
  type AiProvider,
} from "@/lib/ai/providers"

const OLLAMA_TAGS_URL = "http://localhost:11434/api/tags"

type KeyStatus = {
  provider: string
  last4: string
  label: string | null
  updatedAt: string
}

type Settings = {
  advisorProvider: string | null
  advisorModel: string | null
  compareProvider: string | null
  compareModel: string | null
}

type OllamaStatus = "checking" | "available" | "unavailable"

type Note = { type: "success" | "error" | "info"; msg: string }

export function ApiKeysManager() {
  const [keys, setKeys] = useState<Record<string, KeyStatus>>({})
  const [settings, setSettings] = useState<Settings>({
    advisorProvider: null,
    advisorModel: null,
    compareProvider: null,
    compareModel: null,
  })
  const [loading, setLoading] = useState(true)
  const [ollama, setOllama] = useState<OllamaStatus>("checking")
  const [ollamaModels, setOllamaModels] = useState<string[]>([])

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/account/api-keys", { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as { keys: KeyStatus[]; settings: Settings }
      const map: Record<string, KeyStatus> = {}
      for (const k of data.keys) map[k.provider] = k
      setKeys(map)
      setSettings(data.settings)
    } finally {
      setLoading(false)
    }
  }, [])

  const checkOllama = useCallback(async () => {
    setOllama("checking")
    try {
      const r = await fetch(OLLAMA_TAGS_URL, { mode: "cors" })
      if (!r.ok) throw new Error("bad")
      const data = (await r.json()) as { models?: Array<{ name: string }> }
      setOllamaModels((data.models ?? []).map((m) => m.name))
      setOllama("available")
    } catch {
      setOllamaModels([])
      setOllama("unavailable")
    }
  }, [])

  useEffect(() => {
    void load()
    void checkOllama()
  }, [load, checkOllama])

  const readiness = useMemo(() => {
    const map: Record<string, boolean> = {}
    for (const p of AI_PROVIDERS) {
      map[p.id] = p.needsKey ? Boolean(keys[p.id]) : ollama === "available"
    }
    return map
  }, [keys, ollama])

  return (
    <>
      <AccountSection
        title="Bring your own AI"
        description="Pick any provider and paste your own API key — it's encrypted before it touches our database and never leaves the server. Running a model locally with Ollama? No key needed, we detect it automatically."
        action={
          <Link
            href="/ai-setup"
            className="inline-flex h-9 items-center rounded-full border border-brand-500/40 bg-brand-500/10 px-4 text-[13px] font-semibold text-brand-200 transition hover:bg-brand-500/20"
          >
            Setup guide →
          </Link>
        }
      >
        <EngineSelectors
          settings={settings}
          readiness={readiness}
          onSaved={(s) => setSettings(s)}
        />
      </AccountSection>

      <AccountSection
        title="Providers"
        description="Connect as many as you like. The one selected above is what actually runs."
      >
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-xl bg-white/[0.04]"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {AI_PROVIDERS.map((p) =>
              p.needsKey ? (
                <KeyProviderCard
                  key={p.id}
                  provider={p}
                  status={keys[p.id] ?? null}
                  onChanged={load}
                />
              ) : (
                <LocalProviderCard
                  key={p.id}
                  provider={p}
                  status={ollama}
                  models={ollamaModels}
                  onRetry={checkOllama}
                />
              ),
            )}
          </div>
        )}
      </AccountSection>
    </>
  )
}

function EngineSelectors({
  settings,
  readiness,
  onSaved,
}: {
  settings: Settings
  readiness: Record<string, boolean>
  onSaved: (s: Settings) => void
}) {
  const [draft, setDraft] = useState<Settings>(settings)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<Note | null>(null)

  useEffect(() => setDraft(settings), [settings])

  const dirty =
    draft.advisorProvider !== settings.advisorProvider ||
    draft.advisorModel !== settings.advisorModel ||
    draft.compareProvider !== settings.compareProvider ||
    draft.compareModel !== settings.compareModel

  const save = async () => {
    setSaving(true)
    setNote(null)
    try {
      const res = await fetch("/api/account/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advisorProvider: draft.advisorProvider,
          advisorModel: draft.advisorModel,
          compareProvider: draft.compareProvider,
          compareModel: draft.compareModel,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNote({ type: "error", msg: data.error ?? "Could not save." })
        return
      }
      onSaved(data.settings)
      setNote({ type: "success", msg: "AI engines updated." })
    } catch {
      setNote({ type: "error", msg: "Network error." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FeaturePicker
          feature="advisor"
          label="AI Advisor engine"
          provider={draft.advisorProvider}
          model={draft.advisorModel}
          readiness={readiness}
          onChange={(provider, model) =>
            setDraft((d) => ({ ...d, advisorProvider: provider, advisorModel: model }))
          }
        />
        <FeaturePicker
          feature="compare"
          label="AI Compare engine"
          provider={draft.compareProvider}
          model={draft.compareModel}
          readiness={readiness}
          onChange={(provider, model) =>
            setDraft((d) => ({ ...d, compareProvider: provider, compareModel: model }))
          }
        />
      </div>

      {note ? <StatusNote type={note.type}>{note.msg}</StatusNote> : null}

      <button
        type="button"
        onClick={save}
        disabled={saving || !dirty}
        className="inline-flex h-10 items-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save engines"}
      </button>
    </div>
  )
}

function FeaturePicker({
  feature,
  label,
  provider,
  model,
  readiness,
  onChange,
}: {
  feature: AiFeature
  label: string
  provider: string | null
  model: string | null
  readiness: Record<string, boolean>
  onChange: (provider: string | null, model: string | null) => void
}) {
  const options = providersForFeature(feature)
  const selected = provider ? getProvider(provider) : null
  const ready = provider ? readiness[provider] : true

  return (
    <div className="rounded-xl border border-hairline bg-ink-900/40 p-3.5">
      <Field label={label}>
        <Select
          value={provider ?? ""}
          onChange={(e) => {
            const id = e.target.value || null
            const p = id ? getProvider(id) : null
            onChange(id, p ? p.defaultModel : null)
          }}
        >
          <option value="">None (basic mode)</option>
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.needsKey ? "" : " — local"}
              {readiness[p.id] ? "" : " (not ready)"}
            </option>
          ))}
        </Select>
      </Field>

      {selected ? (
        <div className="mt-3">
          <Field label="Model">
            <Select
              value={resolveModel(selected, model)}
              onChange={(e) => onChange(selected.id, e.target.value)}
            >
              {selected.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ) : null}

      {selected && !ready ? (
        <p className="mt-2 text-[11px] leading-relaxed text-amber-300/90">
          {selected.needsKey
            ? "Add this provider's API key below to use it."
            : "Start Ollama on your machine to use this engine."}
        </p>
      ) : null}
    </div>
  )
}

function StatusPill({
  tone,
  children,
}: {
  tone: "on" | "off"
  children: React.ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
        tone === "on"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-hairline bg-white/[0.03] text-ink-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tone === "on" ? "bg-emerald-400" : "bg-ink-600"
        }`}
      />
      {children}
    </span>
  )
}

function ProviderHeader({
  provider,
  pill,
}: {
  provider: AiProvider
  pill: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-ink-950"
          style={{ backgroundColor: provider.accent }}
        >
          {provider.name.slice(0, 1)}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-50">{provider.name}</p>
          <p className="text-[11px] text-ink-500">
            {provider.needsKey ? "API key" : "Local · no key"}
          </p>
        </div>
      </div>
      {pill}
    </div>
  )
}

function KeyProviderCard({
  provider,
  status,
  onChanged,
}: {
  provider: AiProvider
  status: KeyStatus | null
  onChanged: () => void | Promise<void>
}) {
  const [value, setValue] = useState("")
  const [reveal, setReveal] = useState(false)
  const [busy, setBusy] = useState<"save" | "test" | "remove" | null>(null)
  const [note, setNote] = useState<Note | null>(null)

  const save = async () => {
    if (!value.trim()) return
    setBusy("save")
    setNote(null)
    try {
      const res = await fetch("/api/account/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id, key: value.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNote({ type: "error", msg: data.error ?? "Could not save key." })
        return
      }
      setValue("")
      setNote({ type: "success", msg: "Key saved and encrypted." })
      await onChanged()
    } catch {
      setNote({ type: "error", msg: "Network error." })
    } finally {
      setBusy(null)
    }
  }

  const test = async () => {
    setBusy("test")
    setNote(null)
    try {
      const res = await fetch("/api/account/api-keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.id,
          key: value.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.ok) {
        setNote({ type: "success", msg: "Connection works ✓" })
      } else {
        setNote({ type: "error", msg: data.error ?? "Test failed." })
      }
    } catch {
      setNote({ type: "error", msg: "Network error." })
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    setBusy("remove")
    setNote(null)
    try {
      const res = await fetch(
        `/api/account/api-keys?provider=${encodeURIComponent(provider.id)}`,
        { method: "DELETE" },
      )
      if (!res.ok) {
        setNote({ type: "error", msg: "Could not remove key." })
        return
      }
      await onChanged()
    } catch {
      setNote({ type: "error", msg: "Network error." })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-hairline bg-ink-900/40 p-4">
      <ProviderHeader
        provider={provider}
        pill={
          status ? (
            <StatusPill tone="on">····{status.last4}</StatusPill>
          ) : (
            <StatusPill tone="off">Not set</StatusPill>
          )
        }
      />
      <p className="mt-2.5 text-[12px] leading-relaxed text-ink-400">
        {provider.blurb}
      </p>

      <div className="mt-3 space-y-2">
        <div className="relative">
          <TextInput
            type={reveal ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              status ? "Paste a new key to replace" : `Paste your ${provider.name} key`
            }
            autoComplete="off"
            spellCheck={false}
            className="pr-10 font-mono text-[13px]"
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide key" : "Show key"}
            className="absolute inset-y-0 right-2 my-auto flex h-7 w-7 items-center justify-center rounded-md text-ink-500 transition hover:text-ink-200"
          >
            {reveal ? "🙈" : "👁"}
          </button>
        </div>

        {note ? <StatusNote type={note.type}>{note.msg}</StatusNote> : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy !== null || !value.trim()}
            className="inline-flex h-8 items-center rounded-full bg-brand-500 px-3.5 text-[13px] font-semibold text-ink-950 transition hover:bg-brand-400 disabled:opacity-50"
          >
            {busy === "save" ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={test}
            disabled={busy !== null || (!value.trim() && !status)}
            className="inline-flex h-8 items-center rounded-full border border-hairline bg-white/[0.04] px-3.5 text-[13px] font-medium text-ink-100 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            {busy === "test" ? "Testing…" : "Test"}
          </button>
          {status ? (
            <button
              type="button"
              onClick={remove}
              disabled={busy !== null}
              className="inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium text-red-300/80 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
            >
              {busy === "remove" ? "Removing…" : "Remove"}
            </button>
          ) : null}
          {provider.keyUrl ? (
            <a
              href={provider.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[12px] font-medium text-brand-300 hover:underline"
            >
              Get a key →
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function LocalProviderCard({
  provider,
  status,
  models,
  onRetry,
}: {
  provider: AiProvider
  status: OllamaStatus
  models: string[]
  onRetry: () => void
}) {
  const available = status === "available"
  return (
    <div className="flex flex-col rounded-xl border border-hairline bg-ink-900/40 p-4">
      <ProviderHeader
        provider={provider}
        pill={
          status === "checking" ? (
            <StatusPill tone="off">Checking…</StatusPill>
          ) : available ? (
            <StatusPill tone="on">Detected</StatusPill>
          ) : (
            <StatusPill tone="off">Offline</StatusPill>
          )
        }
      />
      <p className="mt-2.5 text-[12px] leading-relaxed text-ink-400">
        {provider.blurb}
      </p>

      {available ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-300">
            {models.length} model{models.length === 1 ? "" : "s"} ready
          </p>
          {models.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {models.slice(0, 4).map((m) => (
                <li
                  key={m}
                  className="rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-ink-300"
                >
                  {m}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-[12px] leading-relaxed text-ink-400">
            Not detected on localhost:11434. Install Ollama, run a model, then
            retry.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-8 items-center rounded-full border border-hairline bg-white/[0.04] px-3.5 text-[13px] font-medium text-ink-100 transition hover:bg-white/[0.08]"
            >
              Retry detection
            </button>
            <Link
              href="/ai-setup#ollama"
              className="text-[12px] font-medium text-brand-300 hover:underline"
            >
              How to set up Ollama →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
