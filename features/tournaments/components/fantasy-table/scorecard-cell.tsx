'use client'

import { BarChart3 } from 'lucide-react'
import { useCallback } from 'react'
import type { FieldEntrant } from '@/features/tournaments/types'

interface ScorecardCellProps {
  entrant: FieldEntrant
  onOpen?: (entrant: FieldEntrant) => void
}

/**
 * Scorecard cell with clickable icon to open player scorecard.
 * Shows a chart icon that opens the player's round-by-round scorecard.
 */
export function ScorecardCell({ entrant, onOpen }: ScorecardCellProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onOpen?.(entrant)
    },
    [entrant, onOpen]
  )

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-white/[0.08] transition-colors text-muted-foreground/70 hover:text-foreground"
      aria-label={`View scorecard for ${entrant.playerName}`}
      title="View scorecard"
    >
      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
    </button>
  )
}
