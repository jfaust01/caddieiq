import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AnalyticsBand, AnalyticsConfidence } from '@/lib/analytics/types'
import { cn } from '@/lib/utils'

import type { RankingRow } from '../types'

/** Tour short labels for the player sub-line. */
const TOUR_SHORT: Record<string, string> = {
  PGA: 'PGA',
  DP_WORLD: 'DP World',
  LIV: 'LIV',
  KORN_FERRY: 'Korn Ferry',
  LPGA: 'LPGA',
}

/** Band → tone, reusing the analytics band vocabulary (no new colors). */
const BAND_TONE: Record<AnalyticsBand, { grade: string; chip: string }> = {
  ELITE: { grade: 'text-success', chip: 'border-success/20 bg-success/10 text-success' },
  STRONG: { grade: 'text-primary', chip: 'border-primary/20 bg-primary/10 text-primary' },
  SOLID: { grade: 'text-primary', chip: 'border-primary/15 bg-primary/5 text-primary' },
  AVERAGE: { grade: 'text-foreground', chip: 'border-border bg-muted text-muted-foreground' },
  DEVELOPING: { grade: 'text-muted-foreground', chip: 'border-border bg-muted text-muted-foreground' },
}

const BAND_LABEL: Record<AnalyticsBand, string> = {
  ELITE: 'Elite',
  STRONG: 'Strong',
  SOLID: 'Solid',
  AVERAGE: 'Average',
  DEVELOPING: 'Developing',
}

const CONFIDENCE_LABEL: Record<AnalyticsConfidence, string> = {
  none: 'No data',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

/** Compact country-code chip; neutral placeholder when unknown (never faked). */
function CountryChip({ code }: { code: string | null }) {
  const label = code && code.trim() ? code.trim().toUpperCase() : null
  return (
    <span
      aria-hidden
      className="inline-flex h-5 min-w-8 items-center justify-center rounded-[3px] bg-muted px-1 text-[10px] font-semibold tracking-wide text-muted-foreground tabular-nums"
    >
      {label ?? '??'}
    </span>
  )
}

interface RankingsTableProps {
  rows: RankingRow[]
}

/**
 * The live rankings leaderboard. Each row is a real engine board row — rank,
 * letter grade, 0–100 score, qualitative band, and confidence — with a link to
 * the player page. Columns that the engine cannot back (trend/movement, course
 * fit, market value, recent-form strip) are intentionally absent rather than
 * shown with placeholder values.
 */
export function RankingsTable({ rows }: RankingsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-14 text-center">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="hidden sm:table-cell">Country</TableHead>
            <TableHead className="w-16 text-center">Grade</TableHead>
            <TableHead className="w-16 text-right">Score</TableHead>
            <TableHead className="hidden text-center md:table-cell">Tier</TableHead>
            <TableHead className="hidden text-center lg:table-cell">Confidence</TableHead>
            <TableHead className="w-10" aria-label="Open player" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const tone = BAND_TONE[row.band]
            return (
              <TableRow key={row.playerId}>
                <TableCell className="text-center">
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                    {row.rank}
                  </span>
                </TableCell>

                <TableCell>
                  <Link
                    href={`/players/${row.playerId}`}
                    className="flex flex-col outline-none hover:underline focus-visible:underline"
                  >
                    <span className="text-sm font-medium text-foreground">{row.name}</span>
                    {row.tour ? (
                      <span className="text-xs text-muted-foreground">
                        {TOUR_SHORT[row.tour] ?? row.tour}
                      </span>
                    ) : null}
                  </Link>
                </TableCell>

                <TableCell className="hidden sm:table-cell">
                  <CountryChip code={row.countryCode} />
                </TableCell>

                <TableCell className="text-center">
                  <span className={cn('text-base font-semibold tracking-tight', tone.grade)}>
                    {row.grade}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {Math.round(row.score)}
                  </span>
                </TableCell>

                <TableCell className="hidden text-center md:table-cell">
                  <Badge variant="outline" className={cn('h-5 border px-1.5 text-[10px]', tone.chip)}>
                    {BAND_LABEL[row.band]}
                  </Badge>
                </TableCell>

                <TableCell className="hidden text-center lg:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {CONFIDENCE_LABEL[row.confidence]}
                  </span>
                </TableCell>

                <TableCell>
                  <Link
                    href={`/players/${row.playerId}`}
                    aria-label={`Open ${row.name} player page`}
                    className="inline-flex text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
