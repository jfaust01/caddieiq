'use client'

import { useEffect, useState } from 'react'
import { HoleScoreImportClient } from '@/features/admin/components/hole-score-import-client'

export default function HoleScoresPage() {
  const [tournaments, setTournaments] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch('/api/admin/tournaments')
        const data = await response.json()
        setTournaments(data)
      } catch (error) {
        console.error('Failed to fetch tournaments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Hole Score Import</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Hole Score Import</h1>
        <p className="text-muted-foreground">
          Import hole-by-hole scorecard data from SportsDataIO. Each import fetches the complete
          leaderboard and populates the hole_scores table with individual hole data including
          DraftKings point calculations.
        </p>
      </div>

      <HoleScoreImportClient tournaments={tournaments} />
    </div>
  )
}
