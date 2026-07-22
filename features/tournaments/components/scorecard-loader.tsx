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
      const url = `/api/tournaments/${tournamentId}/players/${playerId}/rounds/${roundNumber}/scorecard`
      const response = await fetch(url, { signal: controller.signal })

      clearTimeout(timeoutId)

      if (!response.ok) {
        setState('error')
        setError('Unable to load scorecard.')
        return
      }

      const json = await response.json()

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
        setState('error')
        setError('Scorecard request timed out.')
        return
      }

      setState('error')
      setError('Unable to load scorecard.')
    }
  }, [playerId, roundNumber, tournamentId])

  // Fetch when props change
  useEffect(() => {
    fetchScorecard()
  }, [fetchScorecard])

  // Always show the scorecard grid, even with empty data
  // Generate empty scorecard structure if data is null, using courseHoles from API
  const displayData =
    data ||
    ({
      playerName,
      roundNumber,
      totalStrokes: null,
      totalToPar: null,
      totalDkPoints: null,
      courseHoles: data?.courseHoles || Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        par: null,
      })),
      holes: Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        score: null,
        par: null,
        toPar: null,
        dkPoints: null,
      })),
    } as PlayerRoundScorecardData)

  const isLoading = state === 'loading'

  return (
    <div className="p-4">
      <PlayerRoundScorecard data={displayData} isLoading={isLoading} />
      {state === 'error' && (
        <div className="mt-4 p-3 bg-muted/20 rounded">
          <div className="text-center text-xs text-muted-foreground mb-2">
            {error || 'Unable to load scorecard data.'}
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
      )}
    </div>
  )
}
