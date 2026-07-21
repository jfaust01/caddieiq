'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AIInsightsPanel } from './ai-insights-panel'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface PlayerData {
  id: string
  firstName: string
  lastName: string
  worldRanking?: number
  handicap?: number
}

interface PlayerProfileProps {
  playerId: string
}

export default function PlayerProfileComponent({ playerId }: PlayerProfileProps) {
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchPlayer()
  }, [playerId])

  const fetchPlayer = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/player/${playerId}`)
      const data = await response.json()
      setPlayer(data.data?.player)
      setStats(data.data?.stats)
    } catch (error) {
      console.error('Failed to fetch player:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!player) {
    return <div>Player not found</div>
  }

  // Sample data for charts
  const recentFormData = [
    { event: 'Event 1', score: 68, projection: 65 },
    { event: 'Event 2', score: 71, projection: 67 },
    { event: 'Event 3', score: 69, projection: 66 },
    { event: 'Event 4', score: 67, projection: 68 },
  ]

  const strokesGainedData = [
    { category: 'Driving', value: 1.2 },
    { category: 'Approach', value: 0.8 },
    { category: 'Around Green', value: 0.5 },
    { category: 'Putting', value: -0.3 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">
          {player.firstName} {player.lastName}
        </h1>
        <div className="flex gap-6 text-muted-foreground">
          {player.worldRanking && <p>World Ranking: #{player.worldRanking}</p>}
          {player.handicap !== undefined && <p>Handicap: {player.handicap}</p>}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="course">Course History</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="odds">Odds</TabsTrigger>
          <TabsTrigger value="dfs">DFS</TabsTrigger>
          <TabsTrigger value="history">Historical</TabsTrigger>
          <TabsTrigger value="ai">AI Report</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Cuts Made</p>
              <p className="text-3xl font-bold">87%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Avg Finish</p>
              <p className="text-3xl font-bold">15.2</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Wins</p>
              <p className="text-3xl font-bold">3</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Top 10s</p>
              <p className="text-3xl font-bold">24</p>
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Recent Form</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={recentFormData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#ef4444" name="Actual Score" />
                <Line type="monotone" dataKey="projection" stroke="#3b82f6" name="Projection" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Strokes Gained</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strokesGainedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Course History Tab */}
        <TabsContent value="course" className="space-y-4">
          <Card className="p-4">
            <p className="text-muted-foreground">Course-specific statistics coming soon</p>
          </Card>
        </TabsContent>

        {/* Weather Tab */}
        <TabsContent value="weather" className="space-y-4">
          <Card className="p-4">
            <p className="text-muted-foreground">Weather performance analysis coming soon</p>
          </Card>
        </TabsContent>

        {/* Odds Tab */}
        <TabsContent value="odds" className="space-y-4">
          <Card className="p-4">
            <p className="text-muted-foreground">Odds history and analysis coming soon</p>
          </Card>
        </TabsContent>

        {/* DFS Tab */}
        <TabsContent value="dfs" className="space-y-4">
          <Card className="p-4">
            <p className="text-muted-foreground">DFS performance metrics coming soon</p>
          </Card>
        </TabsContent>

        {/* Historical Performance Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className="p-4">
            <p className="text-muted-foreground">Complete historical tournament results coming soon</p>
          </Card>
        </TabsContent>

        {/* AI Report Tab */}
        <TabsContent value="ai" className="space-y-6">
          <AIInsightsPanel context={`player:${playerId}`} limit={8} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
