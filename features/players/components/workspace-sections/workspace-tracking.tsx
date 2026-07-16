'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

interface WorkspaceTrackingProps {
  playerId: string
  playerName: string
}

export function WorkspaceTracking({ playerId, playerName }: WorkspaceTrackingProps) {
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    const tracking = JSON.parse(localStorage.getItem('player-tracking') || '[]')
    setIsTracking(tracking.includes(playerId))
  }, [playerId])

  const toggleTracking = () => {
    const tracking = JSON.parse(localStorage.getItem('player-tracking') || '[]')
    if (isTracking) {
      const updated = tracking.filter((id: string) => id !== playerId)
      localStorage.setItem('player-tracking', JSON.stringify(updated))
    } else {
      localStorage.setItem('player-tracking', JSON.stringify([...tracking, playerId]))
    }
    setIsTracking(!isTracking)
  }

  return (
    <Button
      variant={isTracking ? 'default' : 'outline'}
      size="sm"
      onClick={toggleTracking}
      className="w-full"
    >
      <Eye className={`w-4 h-4 mr-2 ${isTracking ? 'fill-current' : ''}`} />
      {isTracking ? 'Tracking' : 'Start Tracking'}
    </Button>
  )
}
