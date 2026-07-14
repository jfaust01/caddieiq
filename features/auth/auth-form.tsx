"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, signUp } from "@/lib/auth-client"

type AuthMode = "login" | "register"

interface AuthFormProps {
  mode: AuthMode
}

const DASHBOARD_PATH = "/dashboard"

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (mode === "register") {
      const name = String(formData.get("name") ?? "").trim()
      const confirmPassword = String(formData.get("confirmPassword") ?? "")

      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.")
        return
      }

      setIsSubmitting(true)
      const { error: signUpError } = await signUp.email({
        name,
        email,
        password,
      })
      if (signUpError) {
        setError(signUpError.message ?? "Could not create your account.")
        setIsSubmitting(false)
        return
      }
    } else {
      setIsSubmitting(true)
      const { error: signInError } = await signIn.email({ email, password })
      if (signInError) {
        setError(signInError.message ?? "Invalid email or password.")
        setIsSubmitting(false)
        return
      }
    }

    router.push(DASHBOARD_PATH)
    router.refresh()
  }

  const isRegister = mode === "register"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {isRegister && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            required
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          {!isRegister && (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              // Password reset arrives in a later sprint.
              onClick={() => setError("Password reset is coming soon.")}
            >
              Forgot password?
            </button>
          )}
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder="••••••••"
          required
        />
      </div>

      {isRegister && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
          />
        </div>
      )}

      {!isRegister && (
        <div className="flex items-center gap-2">
          <Checkbox id="remember" name="remember" defaultChecked />
          <Label htmlFor="remember" className="font-normal text-muted-foreground">
            Remember me
          </Label>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isRegister ? "Create Account" : "Sign In"}
      </Button>

      {isRegister ? (
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign In
          </Link>
        </p>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => router.push("/register")}
        >
          Create Account
        </Button>
      )}
    </form>
  )
}
