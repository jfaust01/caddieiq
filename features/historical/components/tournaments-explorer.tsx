'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Loader2, Cloud, DollarSign, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Tournament {
  id: string
  name: string
  startDate: string
  endDate: string
  location?: string
  city?: string
  state?: string
  purse?: number
  fieldSize?: number
  winner?: {
    id: string
    firstName: string
    lastName: string
  }
  _count?: {
    matchScores: number
    dfsContests: number
    oddsQuotes: number
  }
}

export function HistoricalTournamentsView() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchTournaments()
  }, [page])

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/historical/tournaments?page=${page}&limit=12`)
      const data = await response.json()
      setTournaments(data.data)
      setTotal(data.pagination.total)
    } catch (error) {
      console.error('Failed to fetch tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search tournaments..."
          className="px-3 py-2 border border-border rounded-md bg-background text-sm"
        />
        <select className="px-3 py-2 border border-border rounded-md bg-background text-sm">
          <option value="">All Seasons</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>
      </div>

      {/* Tournament Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((tournament) => (
            <Card
              key={tournament.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {tournament.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tournament.location && (tournament.city || tournament.state) && (
                      <>
                        {tournament.location} • {tournament.city}, {tournament.state}
                      </>
                    )}
                  </p>
                </div>

                {/* Dates */}
                <div className="text-xs text-muted-foreground">
                  {format(new Date(tournament.startDate), 'MMM d')} -{' '}
                  {format(new Date(tournament.endDate), 'MMM d, yyyy')}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {tournament.purse && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span>${(tournament.purse / 1000000).toFixed(1)}M</span>
                    </div>
                  )}
                  {tournament.fieldSize && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{tournament.fieldSize} players</span>
                    </div>
                  )}
                  {tournament.weatherSnapshots?.[0] && (
                    <div className="flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      <span>{tournament.weatherSnapshots[0].temperature}°F</span>
                    </div>
                  )}
                </div>

                {/* Context Badges */}
                <div className="flex gap-2 flex-wrap">
                  {tournament._count && tournament._count.matchScores > 0 && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs rounded">
                      Leaderboard
                    </span>
                  )}
                  {tournament._count && tournament._count.dfsContests > 0 && (
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs rounded">
                      DFS
                    </span>
                  )}
                  {tournament._count && tournament._count.oddsQuotes > 0 && (
                    <span className="px-2 py-1 bg-green-500/10 text-green-700 dark:text-green-400 text-xs rounded">
                      Odds
                    </span>
                  )}
                </div>

                {/* Action */}
                <Button asChild className="w-full" variant="outline" size="sm">
                  <Link href={`/historical/tournaments/${tournament.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="flex items-center">
          Page {page} of {Math.ceil(total / 12)}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage(page + 1)}
          disabled={page >= Math.ceil(total / 12)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
