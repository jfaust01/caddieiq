// Helper functions for Round DNA visualization

export interface HoleData {
  holeNumber: number
  par: number
  score: number | null
  toPar: number | null
  dkPoints?: number
}

export interface RoundDnaPoint {
  holeNumber: number
  x: number
  y: number
  toPar: number
  cumulativeToPar: number
  hole: HoleData
}

// Calculate cumulative to-par score for each hole
export function calculateCumulativeScores(holes: HoleData[]): Map<number, number> {
  const cumulativeMap = new Map<number, number>()
  let cumulative = 0
  
  for (const hole of holes) {
    if (hole.toPar !== null && hole.toPar !== undefined) {
      cumulative += hole.toPar
      cumulativeMap.set(hole.holeNumber, cumulative)
    }
  }
  
  return cumulativeMap
}

// Map to-par value to dot color
export function getHoleDotColor(status: string | null): string {
  if (!status) return '#6B7280' // gray
  
  switch (status.toLowerCase()) {
    case 'albatross':
      return '#06B6D4' // cyan
    case 'eagle':
      return '#00E676' // bright green
    case 'birdie':
      return '#22C55E' // emerald
    case 'par':
      return '#6B7280' // gray
    case 'bogey':
      return '#F59E0B' // amber
    case 'double':
      return '#F97316' // orange
    case 'triple':
    case 'triplePlus':
      return '#EF4444' // red
    default:
      return '#6B7280' // gray
  }
}

// Calculate hole result status from to-par
export function getHoleStatus(toPar: number | null | undefined): string {
  if (toPar === null || toPar === undefined) return 'missing'
  
  if (toPar <= -3) return 'albatross'
  if (toPar === -2) return 'eagle'
  if (toPar === -1) return 'birdie'
  if (toPar === 0) return 'par'
  if (toPar === 1) return 'bogey'
  if (toPar === 2) return 'double'
  return 'triplePlus'
}

// Convert cumulative to-par to Y coordinate on SVG
export function calculateYPosition(
  cumulativeToPar: number,
  svgHeight: number,
  scale: { min: number; max: number }
): number {
  const { min, max } = scale
  const range = max - min
  const normalized = (cumulativeToPar - min) / range
  return svgHeight - normalized * (svgHeight - 16) - 8 // Leave 8px padding top/bottom
}

// Calculate X position for hole on SVG (linear spacing)
export function calculateXPosition(
  holeNumber: number,
  svgWidth: number,
  totalHoles: number = 18,
  padding: number = 8
): number {
  const usableWidth = svgWidth - 2 * padding
  const stepX = usableWidth / (totalHoles - 1)
  return padding + (holeNumber - 1) * stepX
}

// Generate SVG path for trend line connecting all points
export function generateTrendLinePath(points: RoundDnaPoint[]): string {
  if (points.length === 0) return ''
  
  const pathData = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command} ${point.x} ${point.y}`
    })
    .join(' ')
  
  return pathData
}

// Format to-par for display
export function formatToPar(toPar: number | null): string {
  if (toPar === null || toPar === undefined) return '—'
  if (toPar === 0) return 'E'
  return (toPar > 0 ? '+' : '') + toPar
}

// Calculate round totals
export function calculateRoundTotals(holes: HoleData[]): {
  outScore: number | null
  inScore: number | null
  totalScore: number | null
  outPar: number
  inPar: number
  totalPar: number
} {
  const front9 = holes.filter(h => h.holeNumber <= 9)
  const back9 = holes.filter(h => h.holeNumber > 9)
  
  const outScore = front9.reduce((sum, h) => (h.toPar !== null ? sum + (h.toPar ?? 0) : sum), 0)
  const inScore = back9.reduce((sum, h) => (h.toPar !== null ? sum + (h.toPar ?? 0) : sum), 0)
  const totalScore = outScore + inScore
  
  const outPar = front9.reduce((sum, h) => sum + h.par, 0)
  const inPar = back9.reduce((sum, h) => sum + h.par, 0)
  const totalPar = outPar + inPar
  
  return {
    outScore: front9.some(h => h.toPar !== null) ? outScore : null,
    inScore: back9.some(h => h.toPar !== null) ? inScore : null,
    totalScore: holes.some(h => h.toPar !== null) ? totalScore : null,
    outPar,
    inPar,
    totalPar
  }
}

// Find best and worst holes
export function findBestAndWorstHoles(holes: HoleData[]): {
  bestHole: HoleData | null
  worstHole: HoleData | null
} {
  const completedHoles = holes.filter(h => h.toPar !== null)
  
  if (completedHoles.length === 0) {
    return { bestHole: null, worstHole: null }
  }
  
  let bestHole = completedHoles[0]
  let worstHole = completedHoles[0]
  
  for (const hole of completedHoles) {
    if ((hole.toPar ?? 0) < (bestHole.toPar ?? 0)) {
      bestHole = hole
    }
    if ((hole.toPar ?? 0) > (worstHole.toPar ?? 0)) {
      worstHole = hole
    }
  }
  
  return { bestHole, worstHole }
}
