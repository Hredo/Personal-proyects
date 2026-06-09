"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AccountSection,
  Field,
  Select,
  StatusNote,
  Toggle,
} from "@/components/account/primitives"

type Settings = {
  locale: string
  emailProduct: boolean
  emailUsage: boolean
  reduceMotion: boolean
}

const DEFAULTS: Settings = {
  locale: "en",
  emailProduct: true,
  emailUsage: false,
  reduceMotion: false,
}

export function PreferencesPanel() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<{ type: "success" | "error"; msg: string } | null>(
    null,
  )

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/account/settings", { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as { settings: Settings }
      setSettings({
        locale: data.settings.locale ?? "en",
        emailProduct: data.settings.emailProduct,
        emailUsage: data.settings.emailUsage,
        reduceMotion: data.settings.reduceMotion,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    setNote(null)
    try {
      const res = await fetch("/api/account/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: settings.locale === "es" ? "es" : "en",
          emailProduct: settings.emailProduct,
          emailUsage: settings.emailUsage,
          reduceMotion: settings.reduceMotion,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNote({ type: "error", msg: data.error ?? "Could not save." })
        return
      }
      setNote({ type: "success", msg: "Preferences saved." })
    } catch {
      setNote({ type: "error", msg: "Network error." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AccountSection
        title="Language"
        description="Preferred language for the interface. The AI Advisor always replies in the language you write in."
      >
        {loading ? (
          <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
        ) : (
          <Field label="Interface language" htmlFor="locale">
            <Select
              id="locale"
              value={settings.locale}
              onChange={(e) =>
                setSettings((s) => ({ ...s, locale: e.target.value }))
              }
              className="max-w-xs"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </Select>
          </Field>
        )}
      </AccountSection>

      <AccountSection
        title="Notifications"
        description="Choose what we email you about."
      >
        <div className="divide-y divide-white/5">
          <Toggle
            label="Product updates"
            description="New leagues, features and AI improvements. Occasional."
            checked={settings.emailProduct}
            onChange={(v) => setSettings((s) => ({ ...s, emailProduct: v }))}
            disabled={loading}
          />
          <Toggle
            label="Usage & quota alerts"
            description="A heads-up when you're close to a free-plan limit."
            checked={settings.emailUsage}
            onChange={(v) => setSettings((s) => ({ ...s, emailUsage: v }))}
            disabled={loading}
          />
        </div>
      </AccountSection>

      <AccountSection
        title="Accessibility"
        description="Tone down the heavier motion across the site."
      >
        <div className="divide-y divide-white/5">
          <Toggle
            label="Reduce motion"
            description="Minimise large scroll and reveal animations."
            checked={settings.reduceMotion}
            onChange={(v) => setSettings((s) => ({ ...s, reduceMotion: v }))}
            disabled={loading}
          />
        </div>
      </AccountSection>

      {note ? <StatusNote type={note.type}>{note.msg}</StatusNote> : null}

      <button
        type="button"
        onClick={save}
        disabled={saving || loading}
        className="inline-flex h-10 items-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </>
  )
}
