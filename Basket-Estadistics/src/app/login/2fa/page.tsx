import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { TwoFactorVerifyForm } from "./form"
import { readSessionUser } from "@/lib/auth/server-user"

export const metadata: Metadata = {
  title: "Verify your identity",
  description: "Enter the verification code sent to your email.",
  robots: { index: false, follow: false },
}

export default async function TwoFactorVerifyPage() {
  const user = await readSessionUser()
  if (user) redirect("/ai-advisor")
  return (
    <Suspense fallback={null}>
      <TwoFactorVerifyForm />
    </Suspense>
  )
}
