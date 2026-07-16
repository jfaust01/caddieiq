import { Crosshair, Flag, Gauge, Info, Radar, Ruler, ShieldCheck, Target } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'
import { cn } from '@/lib/utils'
import {
  bandLabel,
  type SkillBand,
  type SkillLeaderboard,
  type SkillLeaderboardKey,
  type SkillLeaderboardEntry,
  type SkillLeaderboards,
} from '@/lib/player-skill-intelligence'

const EM_DASH = '\u2014'

/** Per-board icon, mirroring the semantic-token treatment used elsewhere. */
const BOARD_ICON: Record<SkillLeaderboardKey, typeof Target> = {
  bestIronPlayers: Target,
  bestPutters: Flag,
  bestScramblers: ShieldCheck,
  longestDrivers: Ruler,
  mostAccurateDrivers: Crosshair,
  highestConfidence: Gauge,
}

// Strong bands read as primary, mid as muted, weak as destructive — tokens only.
const BAND_TONE: Record<SkillBand, string> = {
  ELITE: 'text-primary',
  EXCELLENT: 'text-primary',
  ABOVE_AVERAGE: 'text-foreground',
  AVERAGE: 'text-muted-foreground',
  BELOW_AVERAGE: 'text-muted-foreground',
  POOR: 'text-destructive',
  VERY_POOR: 'text-destructive',
}

/** Format an entry's headline value in the board's native terms. */
function entryValue(entry: SkillLeaderboardEntry): string {
  // Driving lists keep native units (yards / accuracy %); every other board
  // shows the normalized 0–100 rating. Confidence board shows its score.
  if (entry.rawValue != null && entry.unit === 'yards') return `${Math.round(entry.rawValue)} yd`
  if (entry.rawValue != null && entry.unit === 'percent') return `${entry.rawValue.toFixed(1)}%`
  return entry.value == null ? EM_DASH : Math.round(entry.value).toString()
}

interface TournamentSkillLeaderboardsProps {
  leaderboards: SkillLeaderboards
}

/**
 * Player Skill Intelligence on the Tournament hub — the fifth Signal Family made
 * visible for the field. Ranks entrants across shared skill leaderboards (best
 * iron players, putters, scramblers, longest/most-accurate drivers, and most
 * complete profiles), each normalized against the platform population by the
 * same engine the Course Fit board consumes, so the hub agrees with itself.
 *
 * Honest by construction: a board only lists players the engine could actually
 * rate. When no strokes-gained data is held for the field, the section renders a
 * neutral placeholder naming the reason — it is never padded with guesses.
 */
export function TournamentSkillLeaderboards({ leaderboards }: TournamentSkillLeaderboardsProps) {
  const populated = leaderboards.boards.filter((board) => board.entries.length > 0)
  const hasData = leaderboards.ratedPlayers > 0 && populated.length > 0

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        as="h3"
        title="Skill intelligence"
        description="Field-relative skill leaderboards from verified round statistics — the shared player-skill signals that feed Course Fit and the models."
      />

      {hasData ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {populated.map((board) => (
              <SkillBoardCard key={board.key} board={board} />
            ))}
          </div>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="text-pretty">
              Ratings are field-relative percentiles across{' '}
              {leaderboards.ratedPlayers} rated{' '}
              {leaderboards.ratedPlayers === 1 ? 'entrant' : 'entrants'}
              {leaderboards.season ? ` (${leaderboards.season} season)` : ''}. Only
              players with verified statistics are ranked; unmeasured players are
              never estimated in.
            </span>
          </p>
        </>
      ) : (
        <UnavailableSkills />
      )}
    </section>
  )
}

function SkillBoardCard({ board }: { board: SkillLeaderboard }) {
  const Icon = BOARD_ICON[board.key]
  return (
    <Card>
      <CardHeader className="gap-1 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-3.5" aria-hidden />
          </span>
          {board.title}
        </CardTitle>
        <p className="text-xs text-muted-foreground text-pretty">{board.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ol className="flex flex-col">
          {board.entries.map((entry) => (
            <li
              key={entry.playerId}
              className="flex items-center gap-3 border-b border-border py-2 last:border-0"
            >
              <span className="w-4 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {entry.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{entry.playerName}</span>
              {entry.band ? (
                <span className={cn('shrink-0 text-xs', BAND_TONE[entry.band])}>{bandLabel(entry.band)}</span>
              ) : null}
              <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums">
                {entryValue(entry)}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

/** Honest placeholder for the no-skill-data state. */
function UnavailableSkills() {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Radar className="size-4" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground text-balance">Awaiting verified skill data</p>
          <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
            No verified round statistics have been captured for this field yet.
            Skill leaderboards fill in automatically once strokes-gained data is
            ingested — nothing here is estimated.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
