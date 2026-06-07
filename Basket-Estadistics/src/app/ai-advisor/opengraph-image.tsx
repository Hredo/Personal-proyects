import { ogCard } from "@/lib/og"

export const alt = "AI Advisor — globalhoopstats"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "nodejs"

export default function AdvisorOgImage() {
  return ogCard({
    title: "AI Advisor",
    subtitle: "Role-based shortlists with transparent reasoning.",
    chips: ["Scouting copilot", "Free during beta", "NBA · EuroLeague · ACB"],
    pill: "Asesor de fichajes",
    accent: "magenta",
  })
}
