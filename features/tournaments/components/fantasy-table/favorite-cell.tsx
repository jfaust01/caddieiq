'use client'

import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FavoriteCellProps {
  playerId: string
  isFavorite: boolean
  onToggle: (playerId: string) => void
}

export function FavoriteCell({ playerId, isFavorite, onToggle }: FavoriteCellProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggle(playerId)
      }}
      className="flex h-full items-center justify-center focus:outline-none"
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        size={18}
        className={cn(
          'transition-all',
          isFavorite
            ? 'fill-red-500 stroke-red-500'
            : 'stroke-muted-foreground hover:stroke-foreground'
        )}
      />
    </button>
  )
}
