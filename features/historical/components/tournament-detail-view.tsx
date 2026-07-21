'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { LeaderboardTab } from './tabs/leaderboard-tab'
import { WeatherTab } from './tabs/weather-tab'
import { OddsTab } from './tabs/odds-tab'
import { DfsTab } from './tabs/dfs-tab'

interface TournamentDetailViewProps {
  tournamentId: string
}

export function TournamentDetailView({ tournamentId }: TournamentDetailViewProps) {
  const [tournament, setTournament] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTournament()
  }, [tournamentId])

  const fetchTournament = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/historical/tournaments/${tournamentId}`)
      const data = await response.json()
      setTournament(data.data)
    } catch (error) {
      console.error('Failed to fetch tournament:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!tournament) {
    return <div>Tournament not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{tournament.name}</h1>
        <div className="mt-2 space-y-1 text-muted-foreground">
          <p>{tournament.course?.name} • {tournament.course?.city}, {tournament.course?.state}</p>
          <p>
            {format(new Date(tournament.startDate), 'MMMM d')} -{' '}
            {format(new Date(tournament.endDate), 'MMMM d, yyyy')}
          </p>
          {tournament.winner && (
            <p className="text-foreground font-medium">
              Winner: {tournament.winner.firstName} {tournament.winner.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="odds">Odds</TabsTrigger>
          <TabsTrigger value="dfs">DFS</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tournament.purse && (
              <div className="p-4 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Purse</p>
                <p className="text-2xl font-bold">${(tournament.purse / 1000000).toFixed(1)}M</p>
              </div>
            )}
            {tournament.fieldSize && (
              <div className="p-4 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Field Size</p>
                <p className="text-2xl font-bold">{tournament.fieldSize}</p>
              </div>
            )}
            <div className="p-4 bg-card border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Rounds</p>
              <p className="text-2xl font-bold">4</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Historical Data</p>
              <p className="text-2xl font-bold">{tournament.matchScores?.length || 0}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <LeaderboardTab tournament={tournament} />
        </TabsContent>

        <TabsContent value="weather">
          <WeatherTab tournament={tournament} />
        </TabsContent>

        <TabsContent value="odds">
          <OddsTab tournament={tournament} />
        </TabsContent>

        <TabsContent value="dfs">
          <DfsTab tournament={tournament} />
        </TabsContent>

        <TabsContent value="stats">
          <div className="p-4 text-center text-muted-foreground">
            Statistics and trends coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
