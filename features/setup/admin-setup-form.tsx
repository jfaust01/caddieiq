"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type SetupState = "loading" | "ready" | "creating" | "success" | "already-exists" | "error"

interface SetupError {
  message: string
  code?: string
}

export function AdminSetupForm() {
  const router = useRouter()
  const [state, setState] = useState<SetupState>("loading")
  const [error, setError] = useState<SetupError | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Check if admin already exists
  useEffect(() => {
    async function checkSetupStatus() {
      try {
        const response = await fetch("/api/setup/admin")
        const data = await response.json()

        if (data.setupComplete) {
          setState("already-exists")
        } else {
          setState("ready")
        }
      } catch (err) {
        console.error("Failed to check setup status:", err)
        setState("error")
        setError({
          message: "Failed to check setup status",
          code: "check_failed",
        })
      }
    }

    checkSetupStatus()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    if (!formData.email || !formData.password) {
      setError({ message: "Email and password are required" })
      return
    }

    if (formData.password.length < 8) {
      setError({ message: "Password must be at least 8 characters" })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError({ message: "Passwords do not match" })
      return
    }

    setState("creating")

    try {
      const response = await fetch("/api/setup/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || formData.email.split("@")[0],
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setState("error")
        setError({
          message: data.error || "Failed to create admin user",
          code: data.code,
        })
        return
      }

      setState("success")
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err) {
      setState("error")
      setError({
        message:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred",
      })
    }
  }

  if (state === "loading") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (state === "already-exists") {
    return (
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle>Setup Already Completed</CardTitle>
          </div>
          <CardDescription>
            An admin user already exists for this instance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Admin Setup Complete</AlertTitle>
            <AlertDescription>
              The admin user has already been created. Please proceed to the
              login page.
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/login")} className="w-full mt-6">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Create Admin User</CardTitle>
        <CardDescription>
          Create the initial admin account for CaddieIQ. This setup page is only
          available in development.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name (Optional)
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              disabled={state === "creating" || state === "success"}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={state === "creating" || state === "success"}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={state === "creating" || state === "success"}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={state === "creating" || state === "success"}
              required
            />
          </div>

          {state === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Success!</AlertTitle>
              <AlertDescription className="text-green-800">
                Admin user created successfully. Redirecting to login...
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={state === "creating" || state === "success"}
          >
            {state === "creating" && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Admin...
              </>
            )}
            {state === "success" && (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Admin Created
              </>
            )}
            {state === "ready" && "Create Admin User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
