import type { Metadata } from "next"
import { SITE } from "@/lib/site"
import AIAdvisorClient from "./client"

export const metadata: Metadata = {
  title: "AI Advisor",
  description:
    "Tell the advisor the role, the budget and the team. Get a reasoned shortlist of players with stats, not a name dump.",
  alternates: { canonical: "/ai-advisor" },
  openGraph: {
    title: `AI Advisor · ${SITE.name}`,
    description:
      "Role-based player shortlists with transparent reasoning. Free during the public beta.",
    url: `${SITE.url}/ai-advisor`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `AI Advisor · ${SITE.name}`,
    description:
      "Role-based player shortlists with transparent reasoning. Free during the public beta.",
  },
}

export default function AIAdvisorPage() {
  return <AIAdvisorClient />
}
