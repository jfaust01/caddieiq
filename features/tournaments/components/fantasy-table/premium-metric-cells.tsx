import type { FieldEntrant } from '@/features/tournaments/types'
import type { DfsValueResult } from '@/lib/dfs-value'
import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import { cn } from '@/lib/utils'

/**
 * AI RATING CELL
 */
export function AiRatingCell({ entrant }: { entrant: FieldEntrant }) {
  const aiRating = entrant.rankingScore

  if (!aiRating) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="text-center">
        <div className="text-cyan-400 font-semibold text-lg sm:text-xl tabular-nums">
          {Math.round(aiRating)}
        </div>
      </div>
    </td>
  )
}

/**
 * RECENT FORM CELL
 */
export function RecentFormCell({ entrant }: { entrant: FieldEntrant }) {
  const formScore = entrant.formScore

  if (!formScore) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="text-center">
        <div className="text-gray-400 font-medium text-sm tabular-nums">
          {Math.round(formScore)}
        </div>
      </div>
    </td>
  )
}

/**
 * AI INTELLIGENCE CELL
 * Combines AI Rating and Recent Form scores
 */
export function AiIntelligenceCell({ entrant }: { entrant: FieldEntrant }) {
  const aiRating = entrant.rankingScore
  const formScore = entrant.formScore

  if (!aiRating && !formScore) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
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
        {formScore !== undefined && formScore !== null ? (
          <div>
            <div className="text-gray-400 font-medium text-sm tabular-nums">
              {Math.round(formScore)}
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              Recent Form
            </div>
          </div>
        ) : null}
      </div>
    </td>
  )
}

/**
 * SALARY CELL
 */
export function SalaryCell({ entrant }: { entrant: FieldEntrant }) {
  const salary = entrant.dfsSalary

  if (!salary) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <DraftKingsMark className="h-3 w-auto flex-shrink-0" />
          <span className="font-semibold text-base sm:text-lg tabular-nums">
            ${(salary / 1000).toFixed(1)}K
          </span>
        </div>
      </div>
    </td>
  )
}

/**
 * DK SCORE CELL
 */
export function DkScoreCell({ entrant }: { entrant: FieldEntrant }) {
  const dkScore = entrant.dkFantasyPoints

  if (dkScore === null || dkScore === undefined) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="text-center">
        <div className="text-emerald-400 font-semibold text-sm sm:text-base tabular-nums">
          {dkScore.toFixed(1)}
        </div>
        <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
          DK Points
        </div>
      </div>
    </td>
  )
}

/**
 * FANTASY OUTLOOK CELL
 * Combines Salary, DK Score, and Fantasy Score
 */
export function FantasyOutlookCell({
  entrant,
  dfsResult,
}: {
  entrant: FieldEntrant
  dfsResult?: DfsValueResult
}) {
  const salary = entrant.dfsSalary
  const dkScore = entrant.dkFantasyPoints
  const fantasyScore = entrant.fantasyScore

  if (!salary && !dkScore && !fantasyScore) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
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
              DK Points
            </div>
          </div>
        ) : null}
        {fantasyScore !== undefined && fantasyScore !== null ? (
          <div>
            <span className="text-gray-400 font-medium text-sm tabular-nums">
              {Math.round(fantasyScore)}
            </span>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              Fantasy Score
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

  if ((ownership === null || ownership === undefined) && (odds === null || odds === undefined)) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  const formatOdds = (rawOdds: string): string => {
    return rawOdds
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
