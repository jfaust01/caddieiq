'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { refreshTournamentWeather } from '@/features/tournaments/services/weather-actions'
import type { WeatherImportStatus } from '@/lib/weather-intelligence/service'

interface WeatherRefreshControlProps {
  tournamentId: string
  importStatus: WeatherImportStatus
}

/** Format absolute ISO date as "Jul 12" using UTC. Server-safe for hydration. */
function formatUTCDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`
}

const RESULT_LABEL: Record<NonNullable<WeatherImportStatus['lastResult']>, string> = {
  STORED: 'Stored',
  SKIPPED: 'Skipped',
  FAILED: 'Failed',
}

/**
 * Admin-only control to manually trigger a weather import for one tournament,
 * with an honest last-import metadata line. The mutation runs through the
 * admin-gated server action; on success the router refreshes so the freshly
 * imported forecast (and updated status) renders immediately. Non-admins never
 * see this — the parent only renders it for admins.
 */
export function WeatherRefreshControl({
  tournamentId,
  importStatus,
}: WeatherRefreshControlProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Calculate relative time only on client after hydration to avoid mismatch
  const [lastSuccessLabel, setLastSuccessLabel] = useState('Loading...')
  const [lastAttemptLabel, setLastAttemptLabel] = useState('')

  useEffect(() => {
    setIsHydrated(true)

    function updateLabels() {
      const lastSuccess = importStatus.lastSuccessAt
        ? (() => {
            const then = new Date(lastSuccess).getTime()
            if (Number.isNaN(then)) return null
            const diffMs = Date.now() - then
            const min = Math.round(diffMs / 60_000)
            if (min < 1) return 'just now'
            if (min < 60) return `${min} min ago`
            const hr = Math.round(min / 60)
            if (hr < 24) return `${hr} hr ago`
            return formatUTCDate(lastSuccess)
          })()
        : null

      setLastSuccessLabel(
        lastSuccess ? `Last stored ${lastSuccess}` : 'No forecast has been stored yet',
      )

      if (importStatus.lastAttemptAt) {
        const lastAttempt = (() => {
          const then = new Date(importStatus.lastAttemptAt).getTime()
          if (Number.isNaN(then)) return null
          const diffMs = Date.now() - then
          const min = Math.round(diffMs / 60_000)
          if (min < 1) return 'just now'
          if (min < 60) return `${min} min ago`
          const hr = Math.round(min / 60)
          if (hr < 24) return `${hr} hr ago`
          return formatUTCDate(importStatus.lastAttemptAt)
        })()
        setLastAttemptLabel(lastAttempt ? ` ${lastAttempt}` : '')
      }
    }

    updateLabels()
    // Update labels periodically to keep relative times fresh
    const interval = setInterval(updateLabels, 60_000)
    return () => clearInterval(interval)
  }, [importStatus.lastSuccessAt, importStatus.lastAttemptAt])

  function onRefresh() {
    setMessage(null)
    startTransition(async () => {
      const result = await refreshTournamentWeather(tournamentId)
      if (result.ok) {
        setMessage({ tone: 'ok', text: result.message })
        router.refresh()
      } else {
        setMessage({ tone: 'error', text: result.message })
      }
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">Admin · weather import</span>
          <span className="text-xs text-muted-foreground">
            {isHydrated ? lastSuccessLabel : 'Loading...'}
            {importStatus.lastResult
              ? ` · last attempt ${RESULT_LABEL[importStatus.lastResult]}${lastAttemptLabel}`
              : ''}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={isPending}>
          <RefreshCw
            data-icon="inline-start"
            className={cn(isPending && 'animate-spin')}
          />
          {isPending ? 'Refreshing…' : 'Refresh weather'}
        </Button>
      </div>

      {(importStatus.providerResponse || importStatus.skippedReason) && (
        <p className="text-xs text-muted-foreground">
          {importStatus.skippedReason ?? importStatus.providerResponse}
        </p>
      )}

      {message && (
        <p
          className={cn(
            'text-xs',
            message.tone === 'ok' ? 'text-muted-foreground' : 'text-destructive',
          )}
          role="status"
          aria-live="polite"
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
