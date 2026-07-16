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
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <Link href="/compare">
            <GitCompareArrows data-icon="inline-start" aria-hidden />
            Compare players
          </Link>
        }
      />
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <Link href="/rankings">
            <ListOrdered data-icon="inline-start" aria-hidden />
            Rankings
          </Link>
        }
      />
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
