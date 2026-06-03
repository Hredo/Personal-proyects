"use client";

import { motion } from "framer-motion";
import { AdvisorResponse } from "./advisor-response";
import type { AdvisorOutput } from "@/lib/ai/local-advisor";

type Props = {
  type: "user" | "ai";
  content: string;
  data?: AdvisorOutput;
};

export function MessageBubble({ type, content, data }: Props) {
  const isUser = type === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-500 px-4 py-2.5 text-sm leading-relaxed text-ink-950 shadow-md">
          {content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex justify-start"
    >
      <div className="max-w-[95%] w-full">
        {data ? (
          <AdvisorResponse data={data} />
        ) : (
          <div className="rounded-2xl rounded-bl-md border border-ink-700/50 bg-ink-800/60 px-4 py-3 text-sm leading-relaxed text-ink-100 backdrop-blur">
            {content}
          </div>
        )}
      </div>
    </motion.div>
  );
}
