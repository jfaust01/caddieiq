import type { FieldEntrant } from '@/features/tournaments/types'
import type { DfsValueResult } from '@/lib/dfs-value'
import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import { getRatingBand } from '@/features/tournaments/utils/ai-rating-band'
import { getFormIcon, getFormColor } from '@/features/tournaments/utils/form-description'
import { Flame, TrendingUp, Circle, TrendingDown, Snowflake, SkipBack } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * AI RATING CELL
 * Displays rating from Analytics Engine with semantic colors and band label.
 */
export function AiRatingCell({ entrant }: { entrant: FieldEntrant }) {
  const aiRating = entrant.rankingScore

  if (!aiRating) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  const { band, colorClass } = getRatingBand(aiRating)

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="flex flex-col gap-1 items-center py-1">
        <div className={cn('font-semibold text-lg sm:text-lg tabular-nums', colorClass)}>
          {Math.round(aiRating)}
        </div>
        {band && (
          <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground/70">
            {band}
          </div>
        )}
      </div>
    </td>
  )
}

/**
 * RECENT FORM CELL
 * Displays recent performance form score with semantic icons.
 * Shows contextual icons (Flame, TrendingUp, Circle, TrendingDown, Snowflake, SkipBack)
 * with color coding to help users assess player form at a glance.
 */
export function RecentFormCell({ entrant }: { entrant: FieldEntrant }) {
  const formScore = entrant.formScore

  if (!formScore) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  const iconName = getFormIcon(formScore)
  const colorClass = getFormColor(formScore)

  const iconMap: Record<string, React.ReactNode> = {
    Flame: <Flame className="w-4 h-4" />,
    TrendingUp: <TrendingUp className="w-4 h-4" />,
    Circle: <Circle className="w-4 h-4" />,
    TrendingDown: <TrendingDown className="w-4 h-4" />,
    Snowflake: <Snowflake className="w-4 h-4" />,
    SkipBack: <SkipBack className="w-4 h-4" />,
  }

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="flex flex-col gap-1.5 items-center py-1">
        <div className={cn('font-semibold text-lg sm:text-lg tabular-nums', colorClass)}>
          {Math.round(formScore)}
        </div>
        <div className="flex items-center justify-center text-muted-foreground/70">
          {iconMap[iconName]}
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
            <div className="text-cyan-400 font-semibold text-lg sm:text-lg tabular-nums">
              {Math.round(aiRating)}
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              AI Rating
            </div>
          </div>
        ) : null}
        {formScore !== undefined && formScore !== null ? (
          <div>
            <div className="text-gray-400 font-medium text-lg sm:text-lg tabular-nums">
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
 * Displays DraftKings salary from provider. Never displays $0 or missing salaries.
 */
export function SalaryCell({ entrant }: { entrant: FieldEntrant }) {
  const salary = entrant.dfsSalary

  // Show em-dash for missing or zero salary
  if (!salary || salary === 0) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <DraftKingsMark className="h-3 w-auto flex-shrink-0" />
          <span className="font-semibold tabular-nums" style={{ fontSize: '18px' }}>
            ${salary.toLocaleString()}
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
        <div className="flex items-center justify-center gap-1">
          <DraftKingsMark className="h-3 w-auto flex-shrink-0" />
          <span className="font-semibold tabular-nums" style={{ color: '#FF6600', fontSize: '18px' }}>
            {dkScore.toFixed(2)}
          </span>
        </div>
      </div>
    </td>
  )
}

/**
 * DK VALUE PER DOLLAR CELL
 * Calculates DK Points / Salary in thousands: dkFantasyPoints ÷ (salary / 1000)
 * Shows value/salary efficiency ratio with one decimal place (e.g. 16.8x or 18.2 pts/$1K)
 */
export function DkValuePerDollarCell({ entrant }: { entrant: FieldEntrant }) {
  const dkScore = entrant.dkFantasyPoints
  const salary = entrant.dfsSalary

  if (!salary || salary === 0 || dkScore === null || dkScore === undefined) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  const valuePerDollar = (dkScore / (salary / 1000)).toFixed(1)

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="text-center">
        <div className="flex flex-col gap-0.5 items-center py-1">
          <div className="flex items-center justify-center gap-1">
            <DraftKingsMark className="h-3 w-auto flex-shrink-0" />
            <span className="font-semibold tabular-nums" style={{ color: '#FF6600', fontSize: '18px' }}>
              {valuePerDollar}x
            </span>
          </div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground/70">
            pts/$1K
          </div>
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
            <span className="font-semibold text-lg sm:text-lg tabular-nums">
              ${(salary / 1000).toFixed(1)}K
            </span>
          </div>
        ) : null}
        {dkScore !== undefined && dkScore !== null ? (
          <div>
            <span className="text-emerald-400 font-semibold text-lg sm:text-lg tabular-nums">
              {dkScore.toFixed(1)}
            </span>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              DK Points
            </div>
          </div>
        ) : null}
        {fantasyScore !== undefined && fantasyScore !== null ? (
          <div>
            <span className="text-gray-400 font-medium text-lg sm:text-lg tabular-nums">
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
 * OWNERSHIP CELL
 * Displays tournament ownership percentage with compact progress bar.
 * Shows percentage (0-100%) from provider data. Never fabricates values.
 */
export function OwnershipCell({ entrant }: { entrant: FieldEntrant }) {
  const ownership = entrant.ownershipPercent

  if (ownership === null || ownership === undefined) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  const percentage = Math.min(Math.max(0, ownership), 100)

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="flex flex-col gap-1.5 items-center py-1">
        <div className="text-violet-400 font-semibold text-lg sm:text-lg tabular-nums">
          {ownership.toFixed(0)}%
        </div>
        <div className="w-full h-1 rounded-full overflow-hidden bg-white/[0.08]">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </td>
  )
}

/**
 * MARKET CELL
 * Displays Odds to Win
 */
/**
 * MARKET CELL
 * Displays Vegas odds to win from provider data. Uses American odds format (+650, +1200, etc).
 * Sorts by implied probability (lower odds = higher probability = better value for favorites).
 */
export function MarketCell({ entrant }: { entrant: FieldEntrant }) {
  const odds = entrant.oddsToWin

  if (odds === null || odds === undefined) {
    return <td className="border-l border-white/[0.055] px-1 sm:px-3 text-center text-gray-500">—</td>
  }

  return (
    <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
      <div className="text-center">
        <div className="text-gray-300 font-semibold text-lg sm:text-lg tabular-nums">
          {odds}
        </div>
        <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground/70">
          to Win
        </div>
      </div>
    </td>
  )
}
