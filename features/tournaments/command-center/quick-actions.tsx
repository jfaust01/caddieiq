"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Copy, GitCompareArrows, ListOrdered, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"

interface QuickActionsProps {
  tournamentId: string
}

/**
 * Quick Actions — client component with local feedback (no global toaster dependency).
 * Provides navigation shortcuts and a copy-link action for the current tournament.
 */
export function QuickActions({ tournamentId }: QuickActionsProps) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      const url =
        typeof window !== "undefined"
          ? window.location.href
          : `/tournaments/${tournamentId}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can fail in restricted contexts; silently ignore.
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/compare"
        className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <GitCompareArrows data-icon="inline-start" aria-hidden />
        Compare players
      </Link>
      <Link
        href="/rankings"
        className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <ListOrdered data-icon="inline-start" aria-hidden />
        Rankings
      </Link>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copyLink}
        aria-label={copied ? "Link copied" : "Copy link to this tournament"}
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copyLink}
        aria-label="Share this tournament"
      >
        <Share2 aria-hidden />
        Share
      </Button>
    </div>
  )
}
