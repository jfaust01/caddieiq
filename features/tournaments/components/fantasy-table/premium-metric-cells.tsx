import type { FieldEntrant } from '@/features/tournaments/types'
import type { DfsValueResult } from '@/lib/dfs-value'
import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import { cn } from '@/lib/utils'

/**
 * AI INTELLIGENCE CELL
 * Combines AI Rating and Course Fit scores
 */
export function AiIntelligenceCell({ entrant }: { entrant: FieldEntrant }) {
  const aiRating = entrant.playerRating
  const courseFit = entrant.courseFit

  if (!aiRating && !courseFit) {
    return <td className="px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="space-y-2 text-center">
        {aiRating !== undefined && aiRating !== null ? (
          <div>
            <div className="text-cyan-400 font-semibold text-xl sm:text-2xl tabular-nums">
              {Math.round(aiRating)}
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              AI Rating
            </div>
          </div>
        ) : null}
        {courseFit !== undefined && courseFit !== null ? (
          <div>
            <div className="text-gray-400 font-medium text-sm tabular-nums">
              {Math.round(courseFit)}
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              Course Fit
            </div>
          </div>
        ) : null}
      </div>
    </td>
  )
}

/**
 * FANTASY OUTLOOK CELL
 * Combines Salary, DK Score, and PTS/$1K
 */
export function FantasyOutlookCell({
  entrant,
  dfsResult,
}: {
  entrant: FieldEntrant
  dfsResult?: DfsValueResult
}) {
  const salary = entrant.salary
  const dkScore = entrant.dkPoints
  const ptsPerK = salary && dkScore ? (dkScore / salary) * 1000 : null

  if (!salary && !dkScore) {
    return <td className="px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="space-y-1.5 text-center">
        {salary ? (
          <div className="flex items-center justify-center gap-1">
            <DraftKingsMark className="h-3 w-auto flex-shrink-0" />
            <span className="font-semibold text-base sm:text-lg tabular-nums">
              ${(salary / 1000).toFixed(1)}K
            </span>
          </div>
        ) : null}
        {dkScore !== undefined && dkScore !== null ? (
          <div>
            <span className="text-emerald-400 font-semibold text-sm sm:text-base tabular-nums">
              {dkScore.toFixed(1)}
            </span>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              DK Score
            </div>
          </div>
        ) : null}
        {ptsPerK ? (
          <div>
            <span className="text-gray-400 font-medium text-sm tabular-nums">
              {ptsPerK.toFixed(1)}
            </span>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              PTS/$1K
            </div>
          </div>
        ) : null}
      </div>
    </td>
  )
}

/**
 * MARKET CELL
 * Combines Ownership % and Odds to Win
 */
export function MarketCell({ entrant }: { entrant: FieldEntrant }) {
  const ownership = entrant.ownershipPercent
  const odds = entrant.oddsToWin

  if (!ownership && !odds) {
    return <td className="px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  const formatOdds = (rawOdds: number): string => {
    if (rawOdds > 0) return `+${rawOdds}`
    return String(rawOdds)
  }

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="space-y-1.5 text-center">
        {ownership !== undefined && ownership !== null ? (
          <div>
            <div className="text-violet-400 font-semibold text-lg sm:text-xl tabular-nums">
              {Math.round(ownership)}%
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              Owned
            </div>
          </div>
        ) : null}
        {odds !== undefined && odds !== null ? (
          <div>
            <div className="text-gray-400 font-medium text-sm tabular-nums">
              {formatOdds(odds)}
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              Odds to Win
            </div>
          </div>
        ) : null}
      </div>
    </td>
  )
}
