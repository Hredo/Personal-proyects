import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { ResetPasswordForm } from "./form"
import { readSessionUser } from "@/lib/auth/server-user"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your globalhoopstats account.",
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage() {
  const user = await readSessionUser()
  if (user) redirect("/account")
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
