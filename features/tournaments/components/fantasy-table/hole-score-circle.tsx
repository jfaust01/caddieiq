'use client'

import { getHoleDotColor, getHoleStatus } from '@/features/tournaments/utils/round-dna-helpers'

interface HoleScoreCircleProps {
  score: number | null
  par: number
  toPar: number | null
  size?: 'sm' | 'md' | 'lg'
}

export function HoleScoreCircle({
  score,
  par,
  toPar,
  size = 'md'
}: HoleScoreCircleProps) {
  if (score === null || toPar === null) return null
  
  const status = getHoleStatus(toPar)
  const color = getHoleDotColor(status)
  
  const sizeMap = {
    sm: 'w-4 h-4 text-7px',
    md: 'w-5 h-5 text-8px',
    lg: 'w-6 h-6 text-9px'
  }
  
  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold flex-shrink-0 ${sizeMap[size]}`}
      style={{
        backgroundColor: color,
        color: '#000'
      }}
    >
      {score}
    </div>
  )
}
