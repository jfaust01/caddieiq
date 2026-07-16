'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Share2, Heart, Zap, FileText } from 'lucide-react'

import type { PlayerDetail } from '@/features/players/types'
import { SnapshotCard } from './snapshot-card'
import { TrendBadge } from './trend-badge'
import { SkillCard } from './skill-card'
import { Timeline } from './timeline'
import { StatTable } from './stat-table'
import { BettingPanel } from './betting-panel'
import { DfsPanel } from './dfs-panel'
import { InsightPanel } from './insight-panel'
import { EmptyAnalyticsState } from './empty-analytics-state'
import { cn } from '@/lib/utils'

interface PlayerProfileV2ViewProps {
  player: PlayerDetail
}

/**
 * Player Profile 2.0: Comprehensive analytics-driven player page.
 *
 * This component renders the new layout described in Sprint 11.0,
 * reusing the component library and integrating existing player data.
 *
 * Sections:
 * 1. Hero (headshot, name, tour, quick actions)
 * 2. Snapshot metrics (form, fit, SG trend, DK value, etc.)
 * 3. Recent form timeline
 * 4. Skill breakdown (strokes gained components)
 * 5. Course history table
 * 6. Betting value panel
 * 7. DFS analysis panel
 * 8. AI Summary (placeholder)
 * 9. Decision Trace (placeholder)
 */
export function PlayerProfileV2View({ player }: PlayerProfileV2ViewProps) {
  // Derive trend data from analytics
  const recentFormScore = player.analytics?.scores?.find(
    (s) => s.key === 'recentForm',
  )
  const formTrend = recentFormScore?.value
    ? recentFormScore.value > 50
      ? 'up'
      : recentFormScore.value < 35
        ? 'down'
        : 'flat'
    : 'flat'

  // Convert course history to stat table rows
  const courseHistoryRows = player.courseHistory.map((ch) => ({
    id: ch.id,
    cells: [
      <span key="course" className="font-medium">
        {ch.course}
      </span>,
      <span key="finish" className="text-sm">
        {ch.bestFinish}
      </span>,
      <span key="rounds" className="text-sm">
        {ch.rounds}
      </span>,
      <span key="avg" className="text-sm tabular-nums">
        {ch.scoringAverage.toFixed(1)}
      </span>,
    ],
  }))

  // Convert recent form to timeline entries
  const formEntries = player.recentForm.map((f) => ({
    id: f.id,
    label: f.event,
    finish: String(f.position === 'CUT' ? 'CUT' : f.position === 'WD' ? 'WD' : f.position),
    metric: undefined,
    date: f.date,
    dateDisplay: new Date(f.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    status: (
      typeof f.position === 'number' && f.position <= 10 ? 'success' : 'neutral'
    ) as 'success' | 'neutral' | 'warning' | 'danger',
  }))

  return (
    <div className="w-full space-y-8">
      {/* HERO SECTION */}
      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <button type="button" className="flex items-center gap-2">
                  <Share2 className="size-4" />
                  Compare
                </button>
              }
              title="Compare with other players"
            />
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <button type="button" className="flex items-center gap-2">
                  <Heart className="size-4" />
                  Favorite
                </button>
              }
              title="Save to favorites"
            />
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <button type="button" className="flex items-center gap-2">
                  <Zap className="size-4" />
                  AI Caddie
                </button>
              }
              title="Get AI-powered insights"
            />
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <button type="button" className="flex items-center gap-2">
                  <FileText className="size-4" />
                  Decision Trace
                </button>
              }
              title="View recommendation reasoning"
            />
          </div>
        </div>
      </div>

      {/* SNAPSHOT CARDS */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Performance Snapshot</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SnapshotCard
            title="Recent Form"
            value={recentFormScore?.value ? String(Math.round(recentFormScore.value)) : '—'}
            label="World ranking trajectory"
            trend={formTrend}
            trendValue={formTrend !== 'flat' ? (formTrend === 'up' ? '+3' : '-2') : ''}
            confidence={recentFormScore?.confidence as 'high' | 'medium' | 'low' | undefined}
            tooltip="Composite of world ranking and week-over-week movement"
          />

          <SnapshotCard
            title="Course Fit"
            value={
              player.upcoming?.fit?.score
                ? String(Math.round(player.upcoming.fit.score))
                : '—'
            }
            label="For upcoming tournament"
            confidence={player.upcoming?.confidence as 'high' | 'medium' | 'low' | undefined}
            tooltip="Course characteristics vs. player strengths"
          />

          <SnapshotCard
            title="Consistency"
            value={(() => {
              const score = player.analytics?.scores?.find((s) => s.key === 'consistency')
              return score?.value ? String(Math.round(score.value)) : '—'
            })()}
            label="Reliability metric"
            confidence="high"
            tooltip="Share of events with positive fantasy production"
          />

          <SnapshotCard
            title="Fantasy Production"
            value={(() => {
              const score = player.analytics?.scores?.find((s) => s.key === 'fantasyProduction')
              return score?.value ? String(Math.round(score.value)) : '—'
            })()}
            label="Scoring average vs field"
            confidence="high"
            tooltip="Average fantasy points per event, normalized"
          />

          <SnapshotCard
            title="Activity"
            value={(() => {
              const score = player.analytics?.scores?.find((s) => s.key === 'activity')
              return score?.value ? String(Math.round(score.value)) : '—'
            })()}
            label="Events played vs field"
            confidence="high"
            tooltip="Durability and tournament participation"
          />

          <SnapshotCard
            title="DraftKings Value"
            value="—"
            label="Placeholder for future integration"
            confidence="low"
            tooltip="DFS salary vs. projected production"
          />
        </div>
      </div>

      {/* RECENT FORM TIMELINE */}
      {formEntries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Recent Form</h2>
          <Timeline
            title="Tournament Finishes"
            entries={formEntries.slice(0, 5)}
            subtitle="Last 5 tournaments, newest first"
          />
        </div>
      )}

      {/* SKILL BREAKDOWN */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Skill Breakdown</h2>
        <SkillCard
          title="Strokes Gained Components"
          subtitle="Relative to field — data pending provider upgrade"
          skills={[
            { label: 'Off the Tee', value: 0, percentile: 'Pending' },
            { label: 'Approach', value: 0, percentile: 'Pending' },
            { label: 'Around Green', value: 0, percentile: 'Pending' },
            { label: 'Putting', value: 0, percentile: 'Pending' },
          ]}
        />
      </div>

      {/* COURSE HISTORY TABLE */}
      {courseHistoryRows.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Course History</h2>
          <StatTable
            title="Venue Performance"
            headers={['Course', 'Best Finish', 'Rounds', 'Avg Score']}
            rows={courseHistoryRows}
            subtitle="Historical results at courses the player has played"
          />
        </div>
      )}

      {/* BETTING PANEL */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Betting Value</h2>
        <BettingPanel
          metrics={[
            { label: 'Outright', odds: 'TBD', confidence: 'low' },
            { label: 'Top 5', odds: 'TBD', confidence: 'low' },
            { label: 'Top 10', odds: 'TBD', confidence: 'low' },
            { label: 'Top 20', odds: 'TBD', confidence: 'low' },
            { label: 'Make Cut', odds: 'TBD', confidence: 'low' },
          ]}
        />
      </div>

      {/* DFS PANEL */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">DFS Analysis</h2>
        <DfsPanel
          metrics={[
            { label: 'Ownership', value: 'TBD', description: 'Expected ownership %' },
            { label: 'Value Score', value: 'TBD', description: 'Salary-adjusted production' },
            { label: 'Cash Game', value: 'TBD', description: 'Floor scenario' },
            { label: 'GPP Leverage', value: 'TBD', description: 'Ceiling scenario' },
          ]}
        />
      </div>

      {/* AI SUMMARY (PLACEHOLDER) */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">AI Summary</h2>
        <InsightPanel
          title="AI Caddie Analysis"
          subtitle="Verified analytics and recommendations"
          status="placeholder"
        >
          This section will summarize the player&apos;s outlook using CaddieIQ&apos;s
          verified analytics engines: form trajectory, course fit for upcoming events,
          comparative skill assessment, and actionable recommendations for roster,
          betting, and DFS decisions.
        </InsightPanel>
      </div>

      {/* DECISION TRACE (PLACEHOLDER) */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Decision Reasoning</h2>
        <InsightPanel
          title="How CaddieIQ Thinks About This Player"
          subtitle="Explainability and reasoning transparency"
          status="placeholder"
          fullHeight
        >
          This section will show exactly how and why CaddieIQ rates this player for your
          tournament. You&apos;ll see a decision tree breaking down form, matchups,
          course fit, salary efficiency, and other factors that feed into roster and
          wagering recommendations.
        </InsightPanel>
      </div>
    </div>
  )
}
