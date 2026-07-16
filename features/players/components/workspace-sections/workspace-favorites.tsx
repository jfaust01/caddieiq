'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'

interface WorkspaceFavoritesProps {
  playerId: string
  playerName: string
}

export function WorkspaceFavorites({ playerId, playerName }: WorkspaceFavoritesProps) {
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('player-favorites') || '[]')
    setIsFavorited(favorites.includes(playerId))
  }, [playerId])

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('player-favorites') || '[]')
    if (isFavorited) {
      const updated = favorites.filter((id: string) => id !== playerId)
      localStorage.setItem('player-favorites', JSON.stringify(updated))
    } else {
      localStorage.setItem('player-favorites', JSON.stringify([...favorites, playerId]))
    }
    setIsFavorited(!isFavorited)
  }

  return (
    <Button
      variant={isFavorited ? 'default' : 'outline'}
      size="sm"
      onClick={toggleFavorite}
      className="w-full"
    >
      <Star className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
      {isFavorited ? 'Favorited' : 'Add to Favorites'}
    </Button>
  )
}
