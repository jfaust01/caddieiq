import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthCard } from "@/features/auth/auth-card"
import { AuthForm } from "@/features/auth/auth-form"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your CaddieIQ workspace.",
}

export default async function RegisterPage() {
  const session = await getSession()
  if (session?.user) redirect("/dashboard")

  return (
    <AuthCard
      title="Create your account"
      description="Start building custom golf models in minutes."
    >
      <AuthForm mode="register" />
    </AuthCard>
  )
}
