'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.log('[v0] Global error:', error.message)
  }, [error])

  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-foreground text-balance">
              Something went wrong
            </h1>
            <p className="max-w-md text-sm text-muted-foreground text-pretty">
              A critical error occurred. Please try reloading the application.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  )
}
