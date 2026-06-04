"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToPdf, exportToWord, type ChatMessage, type TeamContext } from "@/lib/ai/export";

type Format = "pdf" | "word";

type Props = {
  team: TeamContext | null;
  messages: ChatMessage[];
  disabled?: boolean;
};

type FormatOption = {
  id: Format;
  label: string;
  hint: string;
  icon: React.ReactNode;
  accent: string;
  run: (payload: { team: TeamContext; messages: ChatMessage[] }) => void | Promise<void>;
};

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
      <text x="8" y="17" fontSize="6" fontWeight="700" fill="currentColor" stroke="none" fontFamily="Helvetica, Arial, sans-serif">PDF</text>
    </svg>
  );
}

function WordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
      <text x="7.5" y="17" fontSize="6" fontWeight="700" fill="currentColor" stroke="none" fontFamily="Helvetica, Arial, sans-serif">DOC</text>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function ExportMenu({ team, messages, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Format | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const isEmpty = messages.length === 0;
  const isDisabled = disabled || isEmpty || !team || busy !== null;

  const recCount = 0;

  const options: FormatOption[] = [
    {
      id: "pdf",
      label: "PDF (.pdf)",
      hint: "Documento formateado con análisis, fichas y conversación",
      icon: <PdfIcon />,
      accent: "text-rose-300 bg-rose-500/10 ring-rose-400/30",
      run: ({ team, messages }) => exportToPdf({ team, messages }),
    },
    {
      id: "word",
      label: "Word (.docx)",
      hint: "Documento editable con todas las secciones",
      icon: <WordIcon />,
      accent: "text-sky-300 bg-sky-500/10 ring-sky-400/30",
      run: ({ team, messages }) => exportToWord({ team, messages }),
    },
  ];

  async function handleSelect(fmt: FormatOption) {
    if (!team || isEmpty) return;
    setBusy(fmt.id);
    setOpen(false);
    try {
      await fmt.run({ team, messages });
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title={isEmpty ? "Inicia una conversación para poder exportar" : "Exportar conversación"}
        className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 ring-1 ring-brand-400/40 transition hover:from-brand-400 hover:to-brand-500 hover:shadow-xl hover:shadow-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-ink-950 disabled:cursor-not-allowed disabled:from-ink-700 disabled:to-ink-800 disabled:shadow-none disabled:ring-ink-700/40"
      >
        <span className="absolute inset-y-0 left-0 w-1 bg-white/30 transition-all group-hover:w-1.5" aria-hidden />
        {busy ? <Spinner /> : <DownloadIcon />}
        <span className="flex flex-col items-start leading-none">
          <span>{busy ? "Generando…" : "Exportar conversación"}</span>
          {!isEmpty && !busy && (
            <span className="mt-0.5 text-[10px] font-medium text-white/80">
              {messages.length} mensajes · {recCount} candidatos
            </span>
          )}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute right-0 z-30 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="mb-1 flex items-center justify-between px-2.5 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                Formato de descarga
              </p>
              <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold text-brand-300 ring-1 ring-brand-500/30">
                {recCount} candidatos
              </span>
            </div>
            <div className="space-y-1">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(opt)}
                  disabled={busy !== null}
                  className="group flex w-full items-start gap-3 rounded-xl border border-transparent px-2.5 py-2.5 text-left transition hover:border-white/10 hover:bg-white/[0.04] disabled:opacity-40"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${opt.accent}`}>
                    {opt.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-ink-50 group-hover:text-brand-200">
                      {opt.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-ink-400">
                      {opt.hint}
                    </span>
                  </span>
                  {busy === opt.id && <Spinner />}
                </button>
              ))}
            </div>
            <div className="mt-2 border-t border-white/5 px-2.5 py-2 text-[10px] leading-relaxed text-ink-500">
              El informe incluye la conversación completa, las fichas de los jugadores
              recomendados y el diagnóstico del equipo.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
