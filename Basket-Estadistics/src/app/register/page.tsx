import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { AuthForm } from "@/components/auth/auth-form"
import { readSessionUser } from "@/lib/auth/server-user"
import { SITE } from "@/lib/site"

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free globalhoopstats account.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/register" },
  openGraph: {
    title: `Create account · ${SITE.name}`,
    description: "Create a free globalhoopstats account.",
    url: `${SITE.url}/register`,
    type: "website",
  },
}

export default async function RegisterPage() {
  const user = await readSessionUser()
  if (user) redirect("/ai-advisor")
  return (
    <Suspense fallback={null}>
      <AuthForm variant="register" />
    </Suspense>
  )
}
