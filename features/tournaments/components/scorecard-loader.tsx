'use client'

import { useEffect, useState, useCallback } from 'react'
import { PlayerRoundScorecard } from './player-round-scorecard'
import type { PlayerRoundScorecardData } from '@/features/tournaments/actions/get-player-round-scorecard'

interface ScorecardLoaderProps {
  playerId: string
  playerName: string
  tournamentId: string
  roundNumber: number
}

type LoadingState = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export function ScorecardLoader({
  playerId,
  playerName,
  tournamentId,
  roundNumber,
}: ScorecardLoaderProps) {
  const [state, setState] = useState<LoadingState>('idle')
  const [data, setData] = useState<PlayerRoundScorecardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchScorecard = useCallback(async () => {
    // Reset state
    setState('loading')
    setError(null)
    setData(null)

    // Create abort controller with 10 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      console.log('[v0] Fetching scorecard:', {
        playerId,
        round: roundNumber,
        tournament: tournamentId,
      })

      const url = `/api/tournaments/${tournamentId}/players/${playerId}/rounds/${roundNumber}/scorecard`
      const response = await fetch(url, { signal: controller.signal })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error('[v0] Scorecard fetch failed:', {
          status: response.status,
          statusText: response.statusText,
        })
        setState('error')
        setError('Unable to load scorecard.')
        return
      }

      const json = await response.json()
      console.log('[v0] Scorecard response:', json)

      if (!json.data) {
        setState('empty')
        setData(null)
        return
      }

      setData(json.data)
      setState('success')
    } catch (err) {
      clearTimeout(timeoutId)

      if (err instanceof Error && err.name === 'AbortError') {
        console.error('[v0] Scorecard fetch timeout after 10s')
        setState('error')
        setError('Scorecard request timed out.')
        return
      }

      console.error('[v0] Scorecard fetch error:', err)
      setState('error')
      setError('Unable to load scorecard.')
    }
  }, [playerId, roundNumber, tournamentId])

  // Fetch when props change
  useEffect(() => {
    fetchScorecard()
  }, [fetchScorecard])

  // Render states
  if (state === 'loading') {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading scorecard…
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Hole-by-hole scorecard unavailable for this round.
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="p-4">
        <div className="text-center text-sm text-muted-foreground mb-3">
          {error || 'Unable to load scorecard.'}
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => fetchScorecard()}
            className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted/50 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (state === 'success' && data) {
    return (
      <div className="p-4">
        <PlayerRoundScorecard data={data} />
      </div>
    )
  }

  return null
}
