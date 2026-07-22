'use client'

interface ScoreMarkerProps {
  score: number
  par: number
}

export function ScoreMarker({ score, par }: ScoreMarkerProps) {
  const diff = score - par

  if (diff <= -2) {
    // Eagle or better: double green circle
    return (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
        <circle cx="8" cy="12" r="3.5" />
        <circle cx="16" cy="12" r="3.5" />
      </svg>
    )
  }

  if (diff === -1) {
    // Birdie: single green circle
    return (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
        <circle cx="12" cy="12" r="4" />
      </svg>
    )
  }

  if (diff === 1) {
    // Bogey: single red square
    return (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
        <rect x="5" y="5" width="14" height="14" rx="1" />
      </svg>
    )
  }

  if (diff >= 2) {
    // Double bogey: double red squares
    return (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
        <rect x="3" y="3" width="6" height="6" rx="0.5" />
        <rect x="15" y="15" width="6" height="6" rx="0.5" />
      </svg>
    )
  }

  return null
}
