"use client";

import { useState } from "react";
import { FAQ_DATA, type FaqItem } from "@/components/marketing/faq-data";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl">
      <ul className="space-y-2 sm:space-y-3">
        {FAQ_DATA.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.question}>
              <div
                className={`overflow-hidden rounded-xl border transition ${
                  isOpen
                    ? "border-brand-400/40 bg-white/[0.05]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5 sm:py-4"
                >
                  <span className="font-display text-sm font-semibold text-ink-50 sm:text-base">
                    {item.question}
                  </span>
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-ink-200 transition ${
                      isOpen ? "rotate-45 border-brand-400/40 text-brand-200" : ""
                    }`}
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-panel-${i}`}
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="px-4 pb-4 text-sm leading-relaxed text-ink-200 sm:px-5 sm:pb-5 sm:text-[15px]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export type { FaqItem };
