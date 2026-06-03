"use client";

import { useState } from "react";
import { TeamSelector } from "@/app/ai-advisor/team-selector";
import { ChatWindow } from "@/app/ai-advisor/chat-window";
import { InputArea } from "@/app/ai-advisor/input-area";
import type { TeamOption } from "@/types/teams";
import type { AdvisorOutput } from "@/lib/ai/local-advisor";

type Message = {
  id: number;
  type: "user" | "ai";
  content: string;
  data?: AdvisorOutput;
};

const TIPS = [
  "Quiero un buen defensor para el equipo",
  "Necesito un anotador exterior",
  "Buscamos un base organizador",
  "Refuerzo para el juego interior",
  "Una opción económica para la rotación",
  "Fichaje estrella de impacto inmediato",
];

export default function AIAdvisorPage() {
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTeamChange = (team: TeamOption) => {
    setSelectedTeam(team);
    setMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    const userMsg: Message = { id: Date.now(), type: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamSlug: selectedTeam?.slug,
          leagueSlug: selectedTeam?.leagueSlug,
          userMessage: content,
        }),
      });

      const result = await res.json();
      const aiMsg: Message = {
        id: Date.now() + 1,
        type: "ai",
        content: result.content || "",
        data: result.data,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          content: "Ocurrió un error al conectar con el servidor. Intenta de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-5xl flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-ink-950/50 backdrop-blur-sm px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/25">
            <svg className="h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-ink-50">Asesor de Fichajes</h1>
            <p className="text-xs text-ink-400">
              Análisis inteligente basado en tu base de datos
            </p>
          </div>
        </div>
      </header>

      {/* Team selector */}
      <div className="border-b border-white/5 bg-ink-950/30">
        <TeamSelector onTeamChange={handleTeamChange} />
      </div>

      {/* Chat area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <ChatWindow messages={messages} loading={loading} />

        {/* Quick tips */}
        {messages.length === 0 && selectedTeam && (
          <div className="px-4 pb-2">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-ink-500">Preguntas sugeridas</p>
            <div className="flex flex-wrap gap-2">
              {TIPS.map((tip) => (
                <button
                  key={tip}
                  type="button"
                  onClick={() => handleSendMessage(tip)}
                  disabled={loading}
                  className="rounded-full border border-ink-700 bg-ink-800/50 px-3 py-1.5 text-xs text-ink-300 transition hover:border-brand-500/50 hover:text-brand-300 disabled:opacity-30"
                >
                  {tip}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Input */}
      <InputArea
        onSend={handleSendMessage}
        disabled={!selectedTeam}
        loading={loading}
        placeholder={
          !selectedTeam
            ? "Selecciona un equipo arriba..."
            : loading
            ? "Analizando..."
            : `Pregunta sobre fichajes para ${selectedTeam.name}...`
        }
      />
    </div>
  );
}
