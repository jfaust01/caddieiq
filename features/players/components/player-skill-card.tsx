'use client'

import { Activity, Info, Minus, Radar, TrendingDown, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { WhyButton } from '@/features/explainability/components/why-button'
import { usePlayerSkillProfile } from '@/features/players/hooks/use-player-skill-profile'
import { toPlayerSkillExplanation } from '@/lib/explainability'
import {
  bandLabel,
  familyLabel,
  type PlayerSkillProfile,
  type SkillBand,
  type SkillConfidence,
  type SkillSignal,
  type SkillTrendDirection,
} from '@/lib/player-skill-intelligence'

const EM_DASH = '\u2014'

const CONFIDENCE: Record<SkillConfidence, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  high: { label: 'High confidence', variant: 'default' },
  medium: { label: 'Medium confidence', variant: 'secondary' },
  low: { label: 'Low confidence', variant: 'outline' },
  none: { label: 'No data', variant: 'outline' },
}

// Bands map to intensity via semantic tokens only. Strong bands read as primary,
// mid bands as muted-foreground, weak bands as destructive — no raw colors.
const BAND_TONE: Record<SkillBand, { text: string; bar: string }> = {
  ELITE: { text: 'text-primary', bar: 'bg-primary' },
  EXCELLENT: { text: 'text-primary', bar: 'bg-primary' },
  ABOVE_AVERAGE: { text: 'text-foreground', bar: 'bg-primary/70' },
  AVERAGE: { text: 'text-muted-foreground', bar: 'bg-muted-foreground/50' },
  BELOW_AVERAGE: { text: 'text-muted-foreground', bar: 'bg-muted-foreground/40' },
  POOR: { text: 'text-destructive', bar: 'bg-destructive/70' },
  VERY_POOR: { text: 'text-destructive', bar: 'bg-destructive' },
}

const TREND: Record<SkillTrendDirection, { icon: typeof Minus; label: string; text: string }> = {
  improving: { icon: TrendingUp, label: 'Improving', text: 'text-primary' },
  declining: { icon: TrendingDown, label: 'Declining', text: 'text-destructive' },
  stable: { icon: Minus, label: 'Stable', text: 'text-muted-foreground' },
  unknown: { icon: Minus, label: 'No trend', text: 'text-muted-foreground' },
}

function fmtRaw(signal: SkillSignal): string {
  if (signal.rawValue == null) return EM_DASH
  switch (signal.unit) {
    case 'strokes':
      return `${signal.rawValue > 0 ? '+' : ''}${signal.rawValue.toFixed(2)}`
    case 'yards':
      return `${Math.round(signal.rawValue)} yd`
    case 'percent':
      return `${signal.rawValue.toFixed(1)}%`
    default:
      return `${signal.rawValue}`
  }
}

interface PlayerSkillCardProps {
  playerId: string
  /** Player display name, used to label the "Why?" explanation. */
  playerName?: string
}

/**
 * Player Skill Intelligence card (Analytics tab) — the fifth Signal Family made
 * visible. Renders the player's normalized golf-skill profile: strengths and
 * weaknesses, a per-skill field-relative rating with the retained raw value,
 * recent trajectory, and a derived confidence badge.
 *
 * Honest by construction: it reads only the engine's output, which rates a skill
 * solely from data the platform holds. Unrated skills show as "Unknown" (never a
 * fabricated number), missing values render as an em-dash, and an empty profile
 * explains the coverage gap rather than inventing ratings.
 */
export function PlayerSkillCard({ playerId, playerName }: PlayerSkillCardProps) {
  const { profile, isLoading, isError } = usePlayerSkillProfile(playerId)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Radar className="size-4" aria-hidden />
          </span>
          Skill profile
        </CardTitle>
        {profile && profile.status === 'available' ? (
          <div className="flex items-center gap-2">
            <Badge variant={CONFIDENCE[profile.confidence].variant}>{CONFIDENCE[profile.confidence].label}</Badge>
            <WhyButton
              explanation={toPlayerSkillExplanation(profile, {
                kind: 'player',
                id: playerId,
                label: playerName ?? 'this player',
              })}
              srContext={`skill profile for ${playerName ?? 'this player'}`}
            />
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <SkillSkeleton />
        ) : isError ? (
          <Placeholder text="We couldn't reach the skill engine. Please try again in a moment." />
        ) : !profile || profile.status === 'unavailable' ? (
          <Placeholder text={profile?.detail ?? 'No verified round statistics have been captured for this player yet. Skill ratings fill in automatically once data is ingested — nothing here is estimated.'} />
        ) : (
          <SkillBody profile={profile} />
        )}
      </CardContent>
    </Card>
  )
}

function SkillBody({ profile }: { profile: PlayerSkillProfile }) {
  const trend = TREND[profile.trend]
  const TrendIcon = trend.icon
  const rated = profile.skills.filter((s) => s.value != null)
  const unrated = profile.skills.filter((s) => s.value == null)

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Activity className="size-3.5" aria-hidden />
          {profile.sampleSize} {profile.sampleSize === 1 ? 'round' : 'rounds'} analysed
        </span>
        <span>
          {profile.coverage.known} of {profile.coverage.sourceable} skills rated
        </span>
        <span className={`flex items-center gap-1.5 ${trend.text}`}>
          <TrendIcon className="size-3.5" aria-hidden />
          {trend.label}
        </span>
      </div>

      {rated.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {rated.map((signal) => (
            <SkillRow key={signal.key} signal={signal} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-pretty">
          None of the tracked skills have enough field data to rate yet.
        </p>
      )}

      {unrated.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Not yet measured</span>
          <div className="flex flex-wrap gap-1.5">
            {unrated.map((signal) => (
              <Badge key={signal.key} variant="outline" className="text-muted-foreground">
                {signal.label}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span className="text-pretty">
          Ratings are field-relative percentiles from verified round statistics
          {profile.season ? ` (${profile.season} season)` : ''}. Raw values are shown alongside each rating; unmeasured skills are never estimated.
        </span>
      </p>
    </>
  )
}

function SkillRow({ signal }: { signal: SkillSignal }) {
  const band = signal.band!
  const tone = BAND_TONE[band]
  const value = signal.value ?? 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 text-sm">
          <span className="font-medium">{signal.label}</span>
          <span className="text-xs text-muted-foreground">{familyLabel(signal.family)}</span>
        </span>
        <span className="flex items-center gap-2 text-xs">
          <span className="tabular-nums text-muted-foreground">{fmtRaw(signal)}</span>
          <span className={`font-medium ${tone.text}`}>{bandLabel(band)}</span>
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${signal.label} rating`}
      >
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-surface/50 p-4">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Radar className="size-4" aria-hidden />
      </span>
      <p className="text-xs leading-relaxed text-muted-foreground text-pretty">{text}</p>
    </div>
  )
}

function SkillSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-2/3" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
