import { Cloud, CloudRain, Sun } from 'lucide-react'
import { PlayerIntelligencePanel } from './player-intelligence-panel'

interface SlatePlayerGridProps {
  players: Array<{
    id: string
    name: string
    image?: string
    projection: number
    salary: number
    ownership: number
    aiGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
    trend: 'up' | 'down' | 'stable'
    confidence: {
      level: number
      sentiment: 'strong' | 'moderate' | 'weak'
    }
    weather: 'sunny' | 'cloudy' | 'rain'
    courseFit: 'excellent' | 'good' | 'fair' | 'poor'
    riskLevel: 'low' | 'medium' | 'high'
  }>
  onPlayerClick?: (playerId: string) => void
  columns?: 'auto' | '4' | '5' | '6' | '7' | '8'
}

const WEATHER_ICONS = {
  sunny: Sun,
  cloudy: Cloud,
  rain: CloudRain,
}

export function SlatePlayerGrid({
  players,
  onPlayerClick,
  columns = 'auto',
}: SlatePlayerGridProps) {
  const columnClass = {
    auto: 'auto-fill',
    '4': 'grid-cols-4',
    '5': 'grid-cols-5',
    '6': 'grid-cols-6',
    '7': 'grid-cols-7',
    '8': 'grid-cols-8',
  }[columns]

  const containerClass = columns === 'auto'
    ? 'grid auto-cols-fr gap-2'
    : `grid ${columnClass} gap-2`

  return (
    <div className={containerClass}>
      {players.map((player) => (
        <PlayerIntelligencePanel
          key={player.id}
          playerName={player.name}
          playerImage={player.image}
          projection={player.projection}
          salary={player.salary}
          ownership={player.ownership}
          aiGrade={player.aiGrade}
          trend={player.trend}
          confidence={player.confidence}
          weatherIcon={WEATHER_ICONS[player.weather]}
          weatherText={player.weather}
          courseFit={player.courseFit}
          riskLevel={player.riskLevel}
          onClick={() => onPlayerClick?.(player.id)}
        />
      ))}
    </div>
  )
}
