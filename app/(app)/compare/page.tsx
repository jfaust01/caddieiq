"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComparisonTable } from "@/features/comparison/components/comparison-table"
import { PlayerSelector } from "@/features/comparison/components/player-selector"
import { ComparisonVerdictCard } from "@/features/comparison/components/comparison-verdict-card"
import { 
  buildComparison, 
  generateCaddieInsight,
  parseComparisonLink,
  generateVerdict,
  type ComparisonResult,
} from "@/lib/comparison"
import type { PlayerAnalytics } from "@/lib/analytics/types"

export default function ComparePage() {
  const searchParams = useSearchParams()
  const playerIds = parseComparisonLink(searchParams.toString())
  
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [allAnalytics, setAllAnalytics] = useState<PlayerAnalytics[]>([])
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [selectorOpen, setSelectorOpen] = useState(!playerIds.length)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (playerIds.length >= 2) {
      loadComparison(playerIds)
    }
  }, [playerIds])

  async function loadComparison(ids: string[]) {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch analytics for all players from API
      const allAnalytics = await Promise.all(
        ids.map(id =>
          fetch(`/api/players/${id}/analytics`).then(res => res.json()),
        ),
      )
      
      // Get player names from available players list
      const names = ids.map(id => {
        const player = ["seed_p_rahm", "seed_p_fleetwood", "seed_p_rose", "seed_p_matsuyama"]
          .find(p => p === id)
        return player === "seed_p_rahm" ? "Jon Rahm"
          : player === "seed_p_fleetwood" ? "Tommy Fleetwood"
          : player === "seed_p_rose" ? "Justin Rose"
          : "Hideki Matsuyama"
      })
      
      // Build comparison
      const comparison = buildComparison(allAnalytics, ids, names)
      setAllAnalytics(allAnalytics)
      setPlayerNames(names)
      setResult(comparison)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comparison")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlayers = (ids: string[], names: string[]) => {
    const newParams = new URLSearchParams()
    newParams.set("players", ids.join(","))
    window.history.replaceState({}, "", `/compare?${newParams.toString()}`)
    loadComparison(ids)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Player Comparison</h1>
            <p className="text-muted-foreground mt-1">
              Compare up to 4 players side-by-side
            </p>
          </div>
          <Button onClick={() => setSelectorOpen(true)}>
            {result ? "Change Players" : "Select Players"}
          </Button>
        </div>

        {/* Player Selector Modal */}
        <PlayerSelector
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          onSelectPlayers={handleSelectPlayers}
          availablePlayers={[
            { id: "seed_p_rahm", name: "Jon Rahm", rating: 78 },
            { id: "seed_p_fleetwood", name: "Tommy Fleetwood", rating: 72 },
            { id: "seed_p_rose", name: "Justin Rose", rating: 68 },
            { id: "seed_p_matsuyama", name: "Hideki Matsuyama", rating: 71 },
          ]}
        />

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading comparison...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-destructive bg-destructive/5 mb-8">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Comparison view */}
        {result && !loading && (
          <div className="space-y-8">
            {/* Comparison Verdict */}
            <ComparisonVerdictCard
              verdict={generateVerdict(result, allAnalytics, playerNames)}
              onViewFullComparison={() => {
                // Scroll to comparison table
                document.querySelector("#comparison-table")?.scrollIntoView({ behavior: "smooth" })
              }}
            />

            {/* Comparison Table */}
            <div id="comparison-table">
              <h2 className="text-xl font-semibold mb-4">Metrics Breakdown</h2>
              <ComparisonTable result={result} />
            </div>

            {/* Confidence Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {result.confidence.map((conf, idx) => (
                    <div key={conf.playerId} className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-2">
                        {result.playerNames[idx]}
                      </p>
                      <p className="text-2xl font-bold">
                        {conf.highConfMetrics}/{conf.totalMetrics}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        High confidence metrics
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">
                Select 2-4 players to start comparing
              </p>
              <Button onClick={() => setSelectorOpen(true)}>
                Select Players
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
