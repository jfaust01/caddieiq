/**
 * Categorized Season Statistics — Organized by skill area
 *
 * Groups player statistics into:
 * - Driving (Distance, Accuracy, Fairway %)
 * - Approach (GIR %, Distance Control)
 * - Around the Green (Scrambling, Sand Saves)
 * - Putting (Strokes Gained, Average Putts)
 * - Scoring (Average Score, Eagles, Birdies)
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PlayerDetail } from '@/features/players/types'

interface CategoryStat {
  label: string
  value: string | number
  unit?: string
  rank?: string
}

interface StatCategory {
  title: string
  description: string
  icon: React.ReactNode
  stats: CategoryStat[]
}

interface PlayerSeasonStatsCategorizedProps {
  player: PlayerDetail
}

export function PlayerSeasonStatsCategorized({ player }: PlayerSeasonStatsCategorizedProps) {
  const stats = player.seasonStatistics || {}

  const categories: StatCategory[] = [
    {
      title: 'Driving',
      description: 'Tee shot power and accuracy',
      icon: '🎯',
      stats: [
        { label: 'Drive Distance', value: stats.avgDriveDistance || '—', unit: 'yds' },
        { label: 'Driving Accuracy', value: stats.drivingAccuracy ? `${(stats.drivingAccuracy * 100).toFixed(1)}%` : '—' },
        { label: 'Fairway Hit %', value: stats.fairwayHitPercent ? `${(stats.fairwayHitPercent * 100).toFixed(1)}%` : '—' },
      ],
    },
    {
      title: 'Approach',
      description: 'Iron play and approach shots',
      icon: '🏌️',
      stats: [
        { label: 'GIR %', value: stats.girPercent ? `${(stats.girPercent * 100).toFixed(1)}%` : '—' },
        { label: 'Approach Avg', value: stats.avgApproachDistance || '—', unit: 'ft' },
        { label: 'Distance Control', value: stats.distanceControl ? `${(stats.distanceControl * 100).toFixed(0)}%` : '—' },
      ],
    },
    {
      title: 'Around the Green',
      description: 'Short game and recovery',
      icon: '🔄',
      stats: [
        { label: 'Scrambling %', value: stats.scramblingPercent ? `${(stats.scramblingPercent * 100).toFixed(1)}%` : '—' },
        { label: 'Sand Saves %', value: stats.sandSavePercent ? `${(stats.sandSavePercent * 100).toFixed(1)}%` : '—' },
        { label: 'Avg Recovery', value: stats.avgRecoveryDistance || '—', unit: 'ft' },
      ],
    },
    {
      title: 'Putting',
      description: 'Green reading and stroke play',
      icon: '⛳',
      stats: [
        { label: 'SG: Putting', value: stats.sgPutting ? stats.sgPutting.toFixed(2) : '—' },
        { label: 'Avg Putts', value: stats.avgPutts ? stats.avgPutts.toFixed(2) : '—' },
        { label: 'Putts per GIR', value: stats.puttsPerGir ? stats.puttsPerGir.toFixed(2) : '—' },
      ],
    },
    {
      title: 'Scoring',
      description: 'Overall performance metrics',
      icon: '📊',
      stats: [
        { label: 'Scoring Average', value: stats.scoringAverage ? stats.scoringAverage.toFixed(2) : '—' },
        { label: 'Eagles', value: stats.eagleCount || 0, unit: 'per event' },
        { label: 'Birdies', value: stats.birdieCount || 0, unit: 'per event' },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold">Season Statistics</h3>
        <p className="text-sm text-muted-foreground">Performance metrics organized by skill area</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span>{category.icon}</span>
                    {category.title}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {category.stats.map((stat, statIdx) => (
                  <div key={statIdx} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5">
                    <span className="text-sm font-medium text-foreground">{stat.label}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold">{stat.value}</span>
                      {stat.unit && <span className="text-xs text-muted-foreground">{stat.unit}</span>}
                      {stat.rank && <Badge variant="outline" className="ml-1">{stat.rank}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
