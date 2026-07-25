'use client'

type ScorecardModalPhase = 'scheduled' | 'live' | 'completed'

interface ScorecardSummaryStripProps {
  eagles: number | null
  birdies: number | null
  pars: number | null
  bogeys: number | null
  doublePlus: number | null
  fairways?: number | null
  gir?: number | null
  putts?: number | null
  phase: ScorecardModalPhase
}

/**
 * Summary statistics strip showing hole-by-hole summary.
 * Displays eagles, birdies, pars, bogeys, double+, fairways, GIR, putts.
 * Shows only available metrics; omits missing data.
 */
export function ScorecardSummaryStrip({
  eagles,
  birdies,
  pars,
  bogeys,
  doublePlus,
  fairways,
  gir,
  putts,
  phase,
}: ScorecardSummaryStripProps) {
  const stats = [
    { label: 'EAGLES', value: eagles },
    { label: 'BIRDIES', value: birdies },
    { label: 'PARS', value: pars },
    { label: 'BOGEYS', value: bogeys },
    { label: 'DOUBLE+', value: doublePlus },
    { label: 'FAIRWAYS', value: fairways },
    { label: 'GIR', value: gir },
    { label: 'PUTTS', value: putts },
  ]

  const displayStats = stats.filter(s => s.value !== null && s.value !== undefined)

  if (displayStats.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {displayStats.map((stat) => (
        <div
          key={stat.label}
          className="px-3 py-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
        >
          <div className="text-xs font-semibold text-foreground/50 mb-1">
            {stat.label}
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  )
}
