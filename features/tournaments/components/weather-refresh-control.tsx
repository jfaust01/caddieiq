'use client'

import { useState, useTransition } from 'react'
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

/** Absolute → "just now / 3 min ago / 2 hr ago / Jul 12" relative label. */
function relativeTime(iso: string | null): string | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  const diffMs = Date.now() - then
  const min = Math.round(diffMs / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hr ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
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

  const lastSuccess = relativeTime(importStatus.lastSuccessAt)
  const lastAttempt = relativeTime(importStatus.lastAttemptAt)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">Admin · weather import</span>
          <span className="text-xs text-muted-foreground">
            {lastSuccess
              ? `Last stored ${lastSuccess}`
              : 'No forecast has been stored yet'}
            {importStatus.lastResult
              ? ` · last attempt ${RESULT_LABEL[importStatus.lastResult]}${
                  lastAttempt ? ` ${lastAttempt}` : ''
                }`
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
