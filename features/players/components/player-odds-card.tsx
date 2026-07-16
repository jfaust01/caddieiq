'use client'

import { Coins, Info, TrendingUp, Trophy } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlayerOdds } from '@/features/players/hooks/use-player-odds'
import type { OddsConfidence, PlayerOddsView } from '@/lib/odds-intelligence'

const EM_DASH = '\u2014'

const CONFIDENCE: Record<OddsConfidence, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  verified: { label: 'Verified', variant: 'default' },
  partial: { label: 'Partial', variant: 'secondary' },
  unavailable: { label: 'Unavailable', variant: 'outline' },
}

function decimal(value: number | null): string {
  return value == null ? EM_DASH : value.toFixed(2)
}

function american(value: number): string {
  return value > 0 ? `+${value}` : `${value}`
}

function pct(value: number | null): string {
  return value == null ? EM_DASH : `${(value * 100).toFixed(1)}%`
}

interface PlayerOddsCardProps {
  playerId: string
}

/**
 * Player Odds Intelligence card (Analytics tab). Shows the player's de-vigged
 * consensus standing in the outright-winner market of the event they're
 * currently priced in: fair win probability, field rank, consensus price, and
 * the best available price across books.
 *
 * Honest by construction: it reads only verified quotes via the Odds
 * Intelligence Engine. When the player has no captured market it renders a
 * neutral placeholder, and any missing figure shows as an em-dash — never a
 * fabricated price. A thin or stale book is reflected as reduced confidence.
 */
export function PlayerOddsCard({ playerId }: PlayerOddsCardProps) {
  const { odds, isLoading, isError } = usePlayerOdds(playerId)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Coins className="size-4" aria-hidden />
          </span>
          Betting market
        </CardTitle>
        {odds ? <Badge variant={CONFIDENCE[odds.confidence].variant}>{CONFIDENCE[odds.confidence].label}</Badge> : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <OddsSkeleton />
        ) : isError ? (
          <Placeholder text="We couldn't reach the odds engine. Please try again in a moment." />
        ) : !odds || !odds.consensus ? (
          <Placeholder
            text="No sportsbook has priced this player in an upcoming event yet. This fills in automatically once a market is captured — nothing here is estimated."
          />
        ) : (
          <OddsBody odds={odds} />
        )}
      </CardContent>
    </Card>
  )
}

function OddsBody({ odds }: { odds: PlayerOddsView }) {
  const c = odds.consensus!
  const eventName = odds.tournamentName ?? odds.sportTitle ?? 'the current event'

  return (
    <>
      <p className="text-xs text-muted-foreground text-pretty">
        Outright winner market for <span className="font-medium text-foreground">{eventName}</span>.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={Trophy}
          label="Fair win"
          value={pct(c.fairProbability)}
          sub="vig removed"
        />
        <Stat
          icon={TrendingUp}
          label="Field rank"
          value={odds.fieldRank == null ? EM_DASH : `#${odds.fieldRank}`}
          sub={odds.fieldSize == null ? null : `of ${odds.fieldSize}`}
        />
        <Stat
          icon={Coins}
          label="Consensus"
          value={decimal(c.consensusDecimal)}
          sub={american(c.consensusAmerican)}
        />
        <Stat
          icon={Coins}
          label="Best price"
          value={decimal(c.bestPrice.decimalOdds)}
          sub={c.bestPrice.bookmakerTitle}
        />
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span className="text-pretty">
          {`Consensus is the median across ${c.bookCount} ${c.bookCount === 1 ? 'sportsbook' : 'sportsbooks'}; "fair win" removes the book margin. Prices are real bookmaker quotes.`}
        </span>
      </p>
    </>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Coins
  label: string
  value: string
  sub?: string | null
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface/40 p-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      {sub ? <span className="truncate text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  )
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-surface/50 p-4">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Coins className="size-4" aria-hidden />
      </span>
      <p className="text-xs leading-relaxed text-muted-foreground text-pretty">{text}</p>
    </div>
  )
}

function OddsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-2/3" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
