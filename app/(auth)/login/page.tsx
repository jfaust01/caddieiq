import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthCard } from "@/features/auth/auth-card"
import { AuthForm } from "@/features/auth/auth-form"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your CaddieIQ workspace.",
}

export default async function LoginPage() {
  const session = await getSession()
  if (session?.user) redirect("/dashboard")

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to access your models and picks."
    >
      <AuthForm mode="login" />
    </AuthCard>
  )
}
