'use client'

import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { CountryFlag } from '@/features/players/components/country-flag'
import { PlayerHeadshot } from '@/features/players/components/player-headshot'
import { RecentForm } from '@/features/players/components/recent-form'
import { tourLabel } from '@/features/players/utils/format'

import type { RankingRow } from '../types'
import type { RankingWeights } from '@/lib/ranking'
import {
  buildExplanation,
  buildMetricRows,
  confidenceLabel,
} from '../utils/format'
import { MetricBreakdown } from './metric-breakdown'

interface RankingDetailPanelProps {
  row: RankingRow | null
  weights: RankingWeights
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Slide-over preview of a single ranking row: composite score, weighted metric
 * breakdown, recent form, and a placeholder AI rationale. Deep-links to the
 * full player profile.
 */
export function RankingDetailPanel({
  row,
  weights,
  open,
  onOpenChange,
}: RankingDetailPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        {row ? (
          <>
            <SheetHeader className="border-b border-border">
              <div className="flex items-center gap-3">
                <PlayerHeadshot
                  player={{ fullName: row.name, headshotUrl: row.headshotUrl }}
                  size="lg"
                />
                <div className="flex flex-col gap-1">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    {row.name}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 text-left">
                    <CountryFlag nationality={row.nationality} />
                    <span>{tourLabel(row.tour)}</span>
                  </SheetDescription>
                </div>
                <div className="ml-auto flex flex-col items-end">
                  <span className="text-3xl font-semibold tabular-nums text-foreground">
                    {Math.round(row.overallScore)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Rank #{row.rank}
                  </span>
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Recent form
                  </h3>
                  <Badge variant="outline">{confidenceLabel(row.confidence)}</Badge>
                </div>
                <RecentForm form={row.recentForm} />
              </section>

              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Score breakdown
                </h3>
                <MetricBreakdown
                  metrics={buildMetricRows(row.moduleScores, weights)}
                />
              </section>

              {/* TODO(ai): replace this placeholder rationale with the engine's
                  AI-generated explanation once the model layer is live. */}
              <section className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    AI rationale
                  </h3>
                  <Badge variant="secondary" className="ml-auto">
                    Preview
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {row.explanation?.summary ?? buildExplanation(row)}
                </p>
              </section>
            </div>

            <SheetFooter className="flex-row gap-2 border-t border-border">
              <Button
                className="flex-1"
                nativeButton={false}
                render={
                  <Link href={`/players/${row.playerId}`}>
                    View full profile
                    <ArrowUpRight data-icon="inline-end" />
                  </Link>
                }
              />
              <SheetClose
                render={
                  <Button variant="outline" className="flex-1">
                    Close
                  </Button>
                }
              />
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
