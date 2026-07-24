'use client'

import { cn } from '@/lib/utils'

interface PlayerRoundStatsProps {
  holes: Array<{
    holeNumber: number
    score: number | null
    par: number | null
    toPar: number | null
  }>
  courseHoles?: Array<{ par: number | null }> | null
}

export function ScorecardPlayerRoundStats({
  holes,
  courseHoles,
}: PlayerRoundStatsProps) {
  // Calculate stats
  const scoredHoles = holes.filter(h => h.score !== null && h.score !== undefined)
  
  const calculateStat = (condition: (h: typeof holes[0]) => boolean) => {
    return scoredHoles.filter(condition).length
  }

  const birdies = calculateStat(h => (h.toPar ?? 0) < 0)
  const pars = calculateStat(h => (h.toPar ?? 0) === 0)
  const bogeys = calculateStat(h => (h.toPar ?? 0) === 1)
  
  const fairwaysAttempted = holes.filter(h => {
    const par = courseHoles?.[h.holeNumber - 1]?.par
    return par && par >= 4 && h.score !== null && h.score !== undefined
  }).length
  
  const girsAttempted = holes.filter(h => h.score !== null && h.score !== undefined).length
  const girs = holes.filter(h => {
    if (h.score === null || h.score === undefined) return false
    const par = courseHoles?.[h.holeNumber - 1]?.par ?? 0
    return h.score <= par + 2
  }).length
  
  const putts = scoredHoles.reduce((sum, h) => {
    const par = courseHoles?.[h.holeNumber - 1]?.par ?? 0
    const strokesOnGreen = (h.score ?? 0) - Math.max(1, par - 2)
    return sum + Math.max(0, strokesOnGreen)
  }, 0)

  const stats = [
    { label: 'Birdies', value: birdies, color: 'text-emerald-400' },
    { label: 'Pars', value: pars, color: 'text-white' },
    { label: 'Bogeys', value: bogeys, color: 'text-red-400' },
    { label: 'Fairways', value: fairwaysAttempted > 0 ? `${fairwaysAttempted}/${fairwaysAttempted}` : '—', color: 'text-white' },
    { label: 'GIR', value: girsAttempted > 0 ? `${girs}/${girsAttempted}` : '—', color: 'text-white' },
    { label: 'Putts', value: putts || '—', color: 'text-white' },
  ]

  return (
    <div className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 space-y-4 h-fit sticky top-10">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Round Summary</h3>
      
      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
            <span className="text-xs text-white/60 font-medium">{stat.label}</span>
            <span className={cn('text-lg font-bold tabular-nums', stat.color)}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
