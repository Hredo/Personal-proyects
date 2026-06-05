"use client"

import { motion } from "framer-motion"
import { MessageActions } from "./message-actions"
import type { Reaction } from "./message-actions"

type Props = {
  type: "user" | "ai"
  content: string
  reaction: Reaction
  onCopy: () => void
  onLike: () => void
  onDislike: () => void
  onRedo: () => void
  canRedo: boolean
}

const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(INLINE_PATTERN)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 1) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-ink-900/80 px-1 py-0.5 font-mono text-[0.85em] text-brand-200"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{part}</span>
  })
}

type Block =
  | { type: "h1"; content: string }
  | { type: "h2"; content: string; emoji: string | null }
  | {
      type: "h3"
      content: string
      isPlayer: boolean
      playerName: string | null
      playerMeta: string | null
    }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "p"; content: string }

function pickSectionEmoji(content: string): string | null {
  const c = content.toLowerCase()
  if (
    c.startsWith("resumen") ||
    c.startsWith("veredicto") ||
    c.startsWith("conclusión")
  )
    return "🏀"
  if (c.startsWith("perfil") || c.startsWith("ficha")) return "📋"
  if (c.startsWith("estad") || c.startsWith("stats") || c.startsWith("datos"))
    return "📊"
  if (c.startsWith("encaje") || c.startsWith("fit") || c.startsWith("análisis"))
    return "🎯"
  if (c.startsWith("defens") || c.startsWith("recomend")) return "🛡️"
  if (
    c.startsWith("antes de") ||
    c.startsWith("considera") ||
    c.startsWith("puntos a")
  )
    return "💡"
  if (c.startsWith("por qué") || c.startsWith("pregunta")) return "❓"
  return null
}

function extractEmojiAndText(text: string): {
  emoji: string | null
  text: string
} {
  const m = /^([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]+)\s+(.+)$/u.exec(text)
  if (m) {
    return { emoji: m[1], text: m[2] }
  }
  return { emoji: null, text }
}

function parsePlayerHeader(content: string): {
  isPlayer: boolean
  playerName: string | null
  playerMeta: string | null
  cleanContent: string
} {
  const m =
    /^\s*(?:\d+\.\s+)?([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'\- ]+?)\s+—\s+(.+)$/.exec(
      content,
    )
  if (m) {
    return {
      isPlayer: true,
      playerName: m[1].trim(),
      playerMeta: m[2].trim(),
      cleanContent: content,
    }
  }
  return {
    isPlayer: false,
    playerName: null,
    playerMeta: null,
    cleanContent: content,
  }
}

function parseTableRow(line: string): string[] | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null
  if (/^\|[\s\-:|]+\|$/.test(trimmed)) return null
  const cells = trimmed
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim())
  if (cells.every((c) => c === "")) return null
  return cells
}

function parseMarkdown(text: string): Block[] {
  const lines = text.split("\n")
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trimEnd()

    if (line.trim() === "") {
      i++
      continue
    }

    const h1 = /^#\s+(.+)$/.exec(line)
    if (h1) {
      blocks.push({ type: "h1", content: h1[1] })
      i++
      continue
    }

    const h2 = /^##\s+(.+)$/.exec(line)
    if (h2) {
      const raw2 = h2[1]
      const { emoji, text } = extractEmojiAndText(raw2)
      blocks.push({
        type: "h2",
        content: text,
        emoji: emoji ?? pickSectionEmoji(text),
      })
      i++
      continue
    }

    const h3 = /^###\s+(.+)$/.exec(line)
    if (h3) {
      const meta = parsePlayerHeader(h3[1])
      blocks.push({
        type: "h3",
        content: meta.cleanContent,
        isPlayer: meta.isPlayer,
        playerName: meta.playerName,
        playerMeta: meta.playerMeta,
      })
      i++
      continue
    }

    const tableHeader = parseTableRow(line)
    if (tableHeader && i + 1 < lines.length) {
      const sep = parseTableRow(lines[i + 1])
      const isSeparator =
        sep !== null && sep.every((c) => /^:?-+:?$/.test(c) || c === "")
      if (isSeparator) {
        const rows: string[][] = []
        let j = i + 2
        while (j < lines.length) {
          const r = parseTableRow(lines[j])
          if (!r) break
          rows.push(r)
          j++
        }
        blocks.push({ type: "table", headers: tableHeader, rows })
        i = j
        continue
      }
    }

    if (/^\s*[-•]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length) {
        const m = /^\s*[-•]\s+(.+)$/.exec(lines[i].trimEnd())
        if (!m) break
        items.push(m[1])
        i++
      }
      blocks.push({ type: "ul", items })
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length) {
        const m = /^\s*\d+\.\s+(.+)$/.exec(lines[i].trimEnd())
        if (!m) break
        items.push(m[1])
        i++
      }
      blocks.push({ type: "ol", items })
      continue
    }

    const paragraphLines: string[] = [line]
    i++
    while (i < lines.length) {
      const next = lines[i].trimEnd()
      if (next.trim() === "") break
      if (/^#{1,3}\s+/.test(next)) break
      if (/^\s*[-•]\s+/.test(next)) break
      if (/^\s*\d+\.\s+/.test(next)) break
      if (parseTableRow(next)) break
      paragraphLines.push(next)
      i++
    }
    blocks.push({ type: "p", content: paragraphLines.join(" ") })
  }

  return blocks
}

function SectionHeader({
  content,
  emoji,
}: {
  content: string
  emoji: string | null
}) {
  return (
    <div className="mt-3 mb-1.5 flex items-center gap-2 first:mt-0">
      {emoji ? (
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/15 text-sm">
          {emoji}
        </span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
      )}
      <h2 className="text-[15px] font-semibold tracking-tight text-ink-50">
        {renderInline(content)}
      </h2>
    </div>
  )
}

function PlayerCardHeader({
  name,
  meta,
}: {
  name: string
  meta: string | null
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <div className="mt-2 mb-1 flex items-center gap-3 rounded-lg border border-ink-700/60 bg-ink-900/40 px-3 py-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-ink-950">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink-50">{name}</div>
        {meta && (
          <div className="truncate text-xs text-ink-300">
            {renderInline(meta)}
          </div>
        )}
      </div>
    </div>
  )
}

function PlainHeader({
  content,
  level,
}: {
  content: string
  level: "h1" | "h3"
}) {
  const cls =
    level === "h1"
      ? "text-base font-bold text-ink-50"
      : "text-sm font-semibold text-ink-100"
  return <p className={cls}>{renderInline(content)}</p>
}

function isStatTable(headers: string[]): boolean {
  const h = headers.map((s) => s.toLowerCase())
  return (
    h.some((x) => /^(partidos|games|gp)$/.test(x)) ||
    h.some((x) => /^(puntos|points)$/.test(x)) ||
    h.some((x) => /^(rebotes|rebounds)$/.test(x))
  )
}

function StatsTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="my-2 overflow-hidden rounded-lg border border-ink-700/60">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-ink-900/60">
            {headers.map((h, i) => (
              <th
                key={i}
                className="border-b border-ink-700/60 px-2.5 py-1.5 text-left font-semibold text-ink-200"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-ink-700/40 last:border-b-0 odd:bg-ink-900/20"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-2.5 py-1.5 text-ink-100 tabular-nums"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GenericTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="my-2 overflow-hidden rounded-lg border border-ink-700/60">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-ink-900/60">
            {headers.map((h, i) => (
              <th
                key={i}
                className="border-b border-ink-700/60 px-2.5 py-1.5 text-left font-semibold text-ink-200"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-ink-700/40 last:border-b-0 odd:bg-ink-900/20"
            >
              {row.map((cell, ci) => (
                <td key={ci} className="px-2.5 py-1.5 text-ink-100">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BulletList({ items, ordered }: { items: string[]; ordered: boolean }) {
  const Tag = ordered ? "ol" : "ul"
  return (
    <Tag
      className={
        ordered
          ? "list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-100 marker:text-brand-400 marker:font-semibold"
          : "list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-100 marker:text-brand-400"
      }
    >
      {items.map((item, i) => (
        <li key={i}>{renderInline(item)}</li>
      ))}
    </Tag>
  )
}

function MarkdownBlock({ text }: { text: string }) {
  const blocks = parseMarkdown(text)

  return (
    <div className="space-y-1.5">
      {blocks.map((b, i) => {
        if (b.type === "h1")
          return <PlainHeader key={i} content={b.content} level="h1" />
        if (b.type === "h2")
          return <SectionHeader key={i} content={b.content} emoji={b.emoji} />
        if (b.type === "h3") {
          if (b.isPlayer && b.playerName) {
            return (
              <PlayerCardHeader
                key={i}
                name={b.playerName}
                meta={b.playerMeta}
              />
            )
          }
          return <PlainHeader key={i} content={b.content} level="h3" />
        }
        if (b.type === "ul")
          return <BulletList key={i} items={b.items} ordered={false} />
        if (b.type === "ol")
          return <BulletList key={i} items={b.items} ordered={true} />
        if (b.type === "table") {
          if (isStatTable(b.headers)) {
            return <StatsTable key={i} headers={b.headers} rows={b.rows} />
          }
          return <GenericTable key={i} headers={b.headers} rows={b.rows} />
        }
        if (b.type === "p") {
          return (
            <p key={i} className="text-sm leading-relaxed text-ink-100">
              {renderInline(b.content)}
            </p>
          )
        }
        return null
      })}
    </div>
  )
}

export function MessageBubble({
  type,
  content,
  reaction,
  onCopy,
  onLike,
  onDislike,
  onRedo,
  canRedo,
}: Props) {
  const isUser = type === "user"

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-500 px-4 py-2.5 text-sm leading-relaxed text-ink-950 shadow-md whitespace-pre-wrap">
          {content}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex justify-start"
    >
      <div className="max-w-[95%] w-full">
        <div className="rounded-2xl rounded-bl-md border border-ink-700/50 bg-ink-800/60 px-4 py-3.5 backdrop-blur">
          <MarkdownBlock text={content} />
          <MessageActions
            content={content}
            reaction={reaction}
            onCopy={onCopy}
            onLike={onLike}
            onDislike={onDislike}
            onRedo={onRedo}
            canRedo={canRedo}
          />
        </div>
      </div>
    </motion.div>
  )
}
