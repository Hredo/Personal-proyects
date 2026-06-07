import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { AuthForm } from "@/components/auth/auth-form"
import { readSessionUser } from "@/lib/auth/server-user"
import { SITE } from "@/lib/site"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your globalhoopstats account.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
  openGraph: {
    title: `Sign in · ${SITE.name}`,
    description: "Sign in to your globalhoopstats account.",
    url: `${SITE.url}/login`,
    type: "website",
  },
}

export default async function LoginPage() {
  const user = await readSessionUser()
  if (user) redirect("/ai-advisor")
  return (
    <Suspense fallback={null}>
      <AuthForm variant="login" />
    </Suspense>
  )
}
