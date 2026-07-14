'use client'

import { useEffect, useState } from 'react'
import { playerService } from '@/features/players/services/player-service'
import type { PlayerDetail } from '@/features/players/types'

interface UsePlayerDetailResult {
  player: PlayerDetail | null
  isLoading: boolean
  notFound: boolean
}

/**
 * Loads a single player's detail record. Simulates async latency so the
 * loading state can be exercised while the backend is still mocked.
 */
export function usePlayerDetail(playerId: string): UsePlayerDetailResult {
  const [player, setPlayer] = useState<PlayerDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setNotFound(false)

    const timer = setTimeout(() => {
      if (!active) return
      const result = playerService.getPlayerById(playerId)
      if (result) {
        setPlayer(result)
      } else {
        setNotFound(true)
      }
      setIsLoading(false)
    }, 400)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [playerId])

  return { player, isLoading, notFound }
}
