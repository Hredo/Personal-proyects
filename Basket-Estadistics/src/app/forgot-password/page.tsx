import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ForgotPasswordForm } from "./form"
import { readSessionUser } from "@/lib/auth/server-user"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your globalhoopstats password.",
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage() {
  const user = await readSessionUser()
  if (user) redirect("/account")
  return <ForgotPasswordForm />
}
