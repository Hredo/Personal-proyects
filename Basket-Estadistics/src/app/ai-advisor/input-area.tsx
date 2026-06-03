"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
};

export function InputArea({ onSend, disabled = false, loading = false, placeholder = "Escribe tu mensaje..." }: Props) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !disabled) {
      inputRef.current?.focus();
    }
  }, [loading, disabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled || loading) return;
    await onSend(input);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-white/5 bg-ink-950/40 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || loading}
          className="flex-1 rounded-xl border border-ink-700 bg-ink-800/60 px-4 py-2.5 text-sm text-ink-50 placeholder-ink-400 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={disabled || loading || !input.trim()}
          className="shrink-0 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-400 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
