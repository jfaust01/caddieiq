import { Coins, Info, Scale, Sparkles, TrendingUp, Trophy } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'
import { cn } from '@/lib/utils'
import type {
  MarketSignal,
  MarketView,
  OddsConfidence,
  SelectionConsensus,
  TournamentOddsView,
} from '@/lib/odds-intelligence'

const EM_DASH = '\u2014'

/** Confidence → badge treatment + label (mirrors Weather Intelligence). */
const CONFIDENCE: Record<OddsConfidence, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  verified: { label: 'Verified', variant: 'default' },
  partial: { label: 'Partial', variant: 'secondary' },
  unavailable: { label: 'Unavailable', variant: 'outline' },
}

/** Human labels for the market types the provider may expose. */
const MARKET_LABEL: Record<MarketView['market'], string> = {
  TOURNAMENT_WINNER: 'Outright winner',
  TOP_5: 'Top 5 finish',
  TOP_10: 'Top 10 finish',
  TOP_20: 'Top 20 finish',
  MAKE_CUT: 'To make the cut',
  MISS_CUT: 'To miss the cut',
}

const SIGNAL_ICON: Record<MarketSignal['kind'], typeof Trophy> = {
  favorite: Trophy,
  value: TrendingUp,
  disagreement: Scale,
}

/** Format a decimal price, or an em-dash when missing. */
function decimal(value: number | null): string {
  return value == null ? EM_DASH : value.toFixed(2)
}

/** Format American odds with an explicit sign. */
function american(value: number): string {
  return value > 0 ? `+${value}` : `${value}`
}

/** Format a 0..1 probability as a percentage. */
function pct(value: number | null, digits = 1): string {
  return value == null ? EM_DASH : `${(value * 100).toFixed(digits)}%`
}

/** Relative "captured N ago" label from a timestamp. */
function capturedAgo(capturedAt: Date | null): string | null {
  if (!capturedAt) return null
  const hours = Math.max(0, Math.round((Date.now() - capturedAt.getTime()) / 3_600_000))
  if (hours < 1) return 'in the last hour'
  if (hours < 48) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

interface TournamentOddsIntelligenceProps {
  odds: TournamentOddsView
}

/**
 * Odds Intelligence on the Tournament hub. Surfaces the Market Signal Family —
 * a de-vigged, multi-book consensus board for the outright winner plus derived
 * signals (favourite, best price, book disagreement) — with its own confidence
 * grade.
 *
 * Honest by construction: this reads only verified prices from The Odds API. If
 * nothing has been captured for the event it renders a neutral placeholder that
 * names the reason, never a fabricated price. Consensus is derived across books
 * at read time; a thin or stale book lowers confidence rather than being hidden.
 */
export function TournamentOddsIntelligence({ odds }: TournamentOddsIntelligenceProps) {
  const confidence = CONFIDENCE[odds.confidence]
  const winner = odds.markets.find((m) => m.market === 'TOURNAMENT_WINNER') ?? odds.markets[0] ?? null
  const captured = capturedAgo(odds.capturedAt)

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        as="h3"
        title="Odds intelligence"
        description="A de-vigged, multi-sportsbook consensus for the outright market — the shared betting signals that feed the model, sourced from real bookmaker prices."
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="size-4 text-primary" aria-hidden />
            Betting market
          </CardTitle>
          <Badge variant={confidence.variant}>{confidence.label}</Badge>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {odds.confidence === 'unavailable' || !winner ? (
            <UnavailableOdds note={odds.note} />
          ) : (
            <OddsBody market={winner} note={odds.note} captured={captured} />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

/** Honest placeholder for the no-verified-market state. */
function UnavailableOdds({ note }: { note: string | null }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-surface/50 p-4">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Coins className="size-4" aria-hidden />
        </span>
        <div className="flex flex-col gap-1 flex-1">
          <p className="text-sm font-medium text-foreground text-balance">Odds data unavailable</p>
          <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
            Reason: No stored betting markets exist for this tournament
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded border border-gray-700/30 bg-gray-900/20 p-3">
          <p className="text-gray-400 font-medium mb-1">Expected Provider</p>
          <p className="text-gray-300">The Odds API</p>
        </div>
        <div className="rounded border border-gray-700/30 bg-gray-900/20 p-3">
          <p className="text-gray-400 font-medium mb-1">Market Count</p>
          <p className="text-gray-300">0 records</p>
        </div>
      </div>
      {note && (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-surface/40 p-3 text-xs text-muted-foreground text-pretty">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {note}
        </p>
      )}
    </div>
  )
}

/** The available-market body: signals, then the consensus board. */
function OddsBody({
  market,
  note,
  captured,
}: {
  market: MarketView
  note: string | null
  captured: string | null
}) {
  const top = market.selections.slice(0, 12)

  return (
    <>
      {note ? (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-surface/40 p-3 text-xs text-muted-foreground text-pretty">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {note}
        </p>
      ) : null}

      {market.signals.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {market.signals.map((signal) => {
            const Icon = SIGNAL_ICON[signal.kind]
            return (
              <div
                key={`${signal.kind}-${signal.selection}`}
                className="flex items-start gap-2.5 rounded-lg border border-border bg-surface/40 p-3"
              >
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {signal.kind === 'favorite' ? 'Favourite' : signal.kind === 'value' ? 'Best value' : 'Books disagree'}
                  </span>
                  <span className="text-sm text-pretty">{signal.detail}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden />
            {MARKET_LABEL[market.market]} consensus
          </h4>
          <span className="text-xs text-muted-foreground tabular-nums">
            {market.bookCount} {market.bookCount === 1 ? 'book' : 'books'}
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Player</th>
                <th className="px-3 py-2 text-right font-medium">Fair win</th>
                <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Consensus</th>
                <th className="px-3 py-2 text-right font-medium">Best price</th>
                <th className="hidden px-3 py-2 text-right font-medium md:table-cell">Books</th>
              </tr>
            </thead>
            <tbody>
              {top.map((sel, index) => (
                <ConsensusRow key={sel.selectionSlug} selection={sel} rank={index + 1} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span className="text-pretty">
          {`Consensus is the median across ${market.bookCount} ${market.bookCount === 1 ? 'sportsbook' : 'sportsbooks'}; "fair win" removes the book margin`}
          {market.overround != null ? ` (${pct(market.overround, 1)} vig)` : ''}
          {captured ? ` · captured ${captured}` : ''}
          {`. Prices are real bookmaker quotes; missing values show as ${EM_DASH}, never estimated.`}
        </span>
      </p>
    </>
  )
}

/** One row of the consensus board. */
function ConsensusRow({ selection, rank }: { selection: SelectionConsensus; rank: number }) {
  return (
    <tr className={cn('border-b border-border last:border-0', rank === 1 && 'bg-primary/5')}>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="w-5 text-right text-xs text-muted-foreground tabular-nums">{rank}</span>
          <span className="truncate font-medium">{selection.selection}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-right font-semibold tabular-nums">{pct(selection.fairProbability)}</td>
      <td className="hidden px-3 py-2 text-right text-muted-foreground tabular-nums sm:table-cell">
        {decimal(selection.consensusDecimal)} <span className="text-xs">({american(selection.consensusAmerican)})</span>
      </td>
      <td className="px-3 py-2 text-right tabular-nums">
        <span className="font-medium">{decimal(selection.bestPrice.decimalOdds)}</span>
        <span className="ml-1 hidden text-xs text-muted-foreground lg:inline">{selection.bestPrice.bookmakerTitle}</span>
      </td>
      <td className="hidden px-3 py-2 text-right text-muted-foreground tabular-nums md:table-cell">
        {selection.bookCount}
      </td>
    </tr>
  )
}
