'use client'

import { CircleDollarSign, Info, Layers, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlayerDfsValue } from '@/features/players/hooks/use-player-dfs-value'
import {
  TIER_LABEL,
  type DfsConfidence,
  type DfsSignalContribution,
  type DfsValueResult,
  type DfsValueTier,
  type PlayerDfsValue,
} from '@/lib/dfs-value'

const EM_DASH = '\u2014'

const CONFIDENCE: Record<DfsConfidence, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  high: { label: 'High confidence', variant: 'default' },
  medium: { label: 'Medium confidence', variant: 'secondary' },
  low: { label: 'Low confidence', variant: 'outline' },
  none: { label: 'No data', variant: 'outline' },
}

// Tiers map to intensity via semantic tokens only — strong tiers read as
// primary, mid as foreground/muted, weak as destructive. No raw colors.
const TIER_TONE: Record<DfsValueTier, string> = {
  A_PLUS: 'text-primary',
  A: 'text-primary',
  B_PLUS: 'text-foreground',
  B: 'text-foreground',
  C: 'text-muted-foreground',
  D: 'text-destructive',
}

function fmtSalary(salary: number | null): string {
  if (salary == null) return EM_DASH
  return `$${salary.toLocaleString('en-US')}`
}

function fmtScore(score: number | null): string {
  return score == null ? EM_DASH : `${Math.round(score)}`
}

interface PlayerDfsValueCardProps {
  playerId: string
}

/**
 * DFS Value card (Analytics tab) — the flagship composite made visible. Shows
 * the player's salary-adjusted value for their current event: the headline
 * value score and lettered tier, the strength/salary framing behind it, a
 * per-Signal-Family contribution breakdown, and the model's own drivers/risks.
 *
 * Honest by construction: it reads only the model's output. A family that the
 * platform can't back is shown as "unavailable" (never defaulted to a neutral
 * 50), confidence is capped by how much real data exists, and when the player is
 * in no active field the card explains that rather than inventing a score.
 */
export function PlayerDfsValueCard({ playerId }: PlayerDfsValueCardProps) {
  const { value, isLoading, isError } = usePlayerDfsValue(playerId)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" aria-hidden />
          </span>
          DFS value
        </CardTitle>
        {value && value.result.status === 'available' ? (
          <Badge variant={CONFIDENCE[value.result.confidence].variant}>
            {CONFIDENCE[value.result.confidence].label}
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <DfsSkeleton />
        ) : isError ? (
          <Placeholder text="We couldn't reach the DFS Value model. Please try again in a moment." />
        ) : !value ? (
          <Placeholder text="This player isn't in an active tournament field right now, so there's no salary-adjusted DFS value to compute. The card fills in automatically once they're entered in an upcoming event." />
        ) : value.result.status === 'unavailable' ? (
          <Placeholder text={value.result.summary} />
        ) : (
          <DfsBody value={value} />
        )}
      </CardContent>
    </Card>
  )
}

function DfsBody({ value }: { value: PlayerDfsValue }) {
  const { result } = value
  const tier = result.tier
  const tone = tier ? TIER_TONE[tier] : 'text-muted-foreground'

  return (
    <>
      {/* Event framing */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Layers className="size-3.5" aria-hidden />
          {value.tournamentName}
        </span>
        {value.courseName ? <span>{value.courseName}</span> : null}
        <span>
          {value.ratedPlayers} of {value.fieldSize} field rated
        </span>
      </div>

      {/* Headline value */}
      <div className="flex items-end justify-between gap-4 rounded-lg border border-border bg-surface/50 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Value score</span>
          <span className={`text-3xl font-semibold tabular-nums ${tone}`}>{fmtScore(result.score)}</span>
          <span className="text-xs text-muted-foreground">{tier ? `${TIER_LABEL[tier]} value` : 'Unrated'}</span>
        </div>
        <div className="flex gap-6 text-right">
          <Metric label="Strength" value={fmtScore(result.strength)} hint="Projected quality, 0-100" />
          <Metric label="Salary" value={fmtSalary(result.salary)} hint="DraftKings" />
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-pretty leading-relaxed">{result.summary}</p>

      {/* Per-family contribution breakdown */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-medium text-muted-foreground">Signal families</span>
        {result.contributions.map((c) => (
          <ContributionRow key={c.key} contribution={c} />
        ))}
      </div>

      {/* Drivers + risks */}
      {result.drivers.length > 0 ? (
        <FactorList
          title="Value drivers"
          icon={TrendingUp}
          tone="text-primary"
          items={result.drivers.map((d) => ({ label: d.label, detail: d.detail }))}
        />
      ) : null}
      {result.risks.length > 0 ? (
        <FactorList
          title="Risks"
          icon={ShieldAlert}
          tone="text-destructive"
          items={result.risks.map((r) => ({ label: r.label, detail: r.detail }))}
        />
      ) : null}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span className="text-pretty">
          Value fuses every Signal Family with the player&apos;s DraftKings salary, ranked within this field. Families the platform can&apos;t back are marked unavailable and lower confidence — never defaulted to a neutral score.
        </span>
      </p>
    </>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{hint}</span>
    </div>
  )
}

function ContributionRow({ contribution }: { contribution: DfsSignalContribution }) {
  const scored = contribution.status === 'scored' && contribution.score != null
  const width = scored ? contribution.score! : 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 text-sm">
          <span className="font-medium">{contribution.label}</span>
          {contribution.weight > 0 ? (
            <span className="text-xs text-muted-foreground">{Math.round(contribution.weight * 100)}% weight</span>
          ) : null}
        </span>
        <span className="flex items-center gap-2 text-xs">
          {scored ? (
            <>
              <span className="tabular-nums text-muted-foreground">{fmtScore(contribution.score)}</span>
              {contribution.rating ? <span className="font-medium text-foreground">{contribution.rating}</span> : null}
            </>
          ) : (
            <span className="text-muted-foreground">Unavailable</span>
          )}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuenow={Math.round(width)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${contribution.label} strength`}
      >
        <div
          className={`h-full rounded-full ${scored ? 'bg-primary' : 'bg-muted-foreground/20'}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function FactorList({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string
  icon: typeof TrendingUp
  tone: string
  items: { label: string; detail: string }[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={`flex items-center gap-1.5 text-xs font-medium ${tone}`}>
        <Icon className="size-3.5" aria-hidden />
        {title}
      </span>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-foreground">{item.label}</span>
            <span className="text-right text-muted-foreground">{item.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-surface/50 p-4">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CircleDollarSign className="size-4" aria-hidden />
      </span>
      <p className="text-xs leading-relaxed text-muted-foreground text-pretty">{text}</p>
    </div>
  )
}

function DfsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
