/**
 * Player Form Chart — Visual trend of recent finishes
 *
 * Displays:
 * - Last 10 tournament finishes
 * - Trend line (improving/declining/stable)
 * - Cut/missed cut indicators
 * - Average finish trajectory
 */

'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PlayerDetail } from '@/features/players/types'

interface PlayerFormChartProps {
  player: PlayerDetail
}

export function PlayerFormChart({ player }: PlayerFormChartProps) {
  const recentForm = player.recentForm || []

  const chartData = useMemo(() => {
    return recentForm.slice(0, 10).map((finish, idx) => ({
      tournament: finish.tournamentName ? finish.tournamentName.substring(0, 6) : `T${idx + 1}`,
      position: finish.finishPosition || 0,
      status: finish.status || 'COMPLETED',
      isMissedCut: finish.status === 'MISSED_CUT',
      isWithdrawn: finish.status === 'WITHDREW',
      display: finish.status === 'MISSED_CUT' ? 'MC' : finish.status === 'WITHDREW' ? 'W' : finish.finishPosition?.toString() || '—',
    }))
  }, [recentForm])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Form</CardTitle>
          <CardDescription>Last 10 tournament finishes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent tournament data available.</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate trend
  const finishes = chartData.filter((d) => !d.isMissedCut && !d.isWithdrawn).map((d) => d.position)
  const firstHalf = finishes.slice(0, Math.ceil(finishes.length / 2))
  const secondHalf = finishes.slice(Math.ceil(finishes.length / 2))
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b) / firstHalf.length : 0
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b) / secondHalf.length : 0

  const trend = secondAvg < firstAvg - 2 ? 'improving' : secondAvg > firstAvg + 2 ? 'declining' : 'stable'
  const trendColor = trend === 'improving' ? 'text-green-600 dark:text-green-400' : trend === 'declining' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
  const missedCutCount = chartData.filter((d) => d.isMissedCut).length
  const avgFinish = finishes.length > 0 ? (finishes.reduce((a, b) => a + b) / finishes.length).toFixed(1) : '—'

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.[0]) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-border bg-card p-2 text-xs text-foreground shadow-lg">
          <p>{data.tournament}</p>
          <p>{data.display === 'MC' ? 'Missed Cut' : data.display === 'W' ? 'Withdrew' : `Finished T${data.position}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Recent Form</CardTitle>
            <CardDescription>Last 10 tournament finishes</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={trendColor}>
              {trend}
            </Badge>
            {missedCutCount > 0 && <Badge variant="destructive">MC x{missedCutCount}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="tournament"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
              label={{ value: 'Finish Position', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="position"
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/50 p-3 text-sm">
          <div>
            <span className="text-muted-foreground">Average Finish</span>
            <p className="font-semibold">T{avgFinish}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Missed Cuts</span>
            <p className="font-semibold">{missedCutCount}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Events</span>
            <p className="font-semibold">{finishes.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
