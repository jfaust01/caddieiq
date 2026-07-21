'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface AISummaryData {
  tournamentRating: number
  difficulty: string
  weatherRisk: string
  ownershipConcentration: number
  slateVolatility: string
  confidenceScore: number
  keyTakeaways: string[]
  bestValue: {
    playerName: string
    reason: string
    confidence: number
  }
  bestLeverage: {
    playerName: string
    reason: string
    confidence: number
  }
  bestFade: {
    playerName: string
    reason: string
    confidence: number
  }
  bestCashPlay: {
    playerName: string
    reason: string
    confidence: number
  }
  bestGppPlay: {
    playerName: string
    reason: string
    confidence: number
  }
}

interface AISummaryCardProps {
  tournamentId: string
}

export function AISummaryCard({ tournamentId }: AISummaryCardProps) {
  const [data, setData] = useState<AISummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [tournamentId])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/tournament-summary?id=${tournamentId}`)
      const result = await response.json()
      setData(result.data)
    } catch (error) {
      console.error('Failed to fetch AI summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-500'
    if (rating >= 6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500/20 text-green-600 dark:text-green-400'
    if (confidence >= 0.6) return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
    return 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
  }

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">AI Tournament Analysis</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Overall Confidence:</span>
            <span className={`text-2xl font-bold ${getConfidenceColor(data.confidenceScore)}`}>
              {(data.confidenceScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Tournament Rating</p>
            <p className={`text-3xl font-bold ${getRatingColor(data.tournamentRating)}`}>
              {data.tournamentRating.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">/10</p>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Difficulty</p>
            <p className="text-lg font-bold">{data.difficulty}</p>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Weather Risk</p>
            <p className="text-lg font-bold">{data.weatherRisk}</p>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Ownership</p>
            <p className="text-lg font-bold">{data.ownershipConcentration}%</p>
            <p className="text-xs text-muted-foreground mt-1">Concentrated</p>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Slate Volatility</p>
            <p className="text-lg font-bold">{data.slateVolatility}</p>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Key Takeaways</h3>
          <div className="space-y-2">
            {data.keyTakeaways.map((takeaway, idx) => (
              <div key={idx} className="flex gap-2 p-2 bg-muted/50 rounded text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-500" />
                <span>{takeaway}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Play Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best Value */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold">Best Value</h3>
          </div>
          <p className="text-lg font-bold mb-2">{data.bestValue.playerName}</p>
          <p className="text-sm text-muted-foreground mb-2">{data.bestValue.reason}</p>
          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(data.bestValue.confidence)}`}>
            {(data.bestValue.confidence * 100).toFixed(0)}% Confidence
          </div>
        </Card>

        {/* Best Leverage */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold">Best Leverage</h3>
          </div>
          <p className="text-lg font-bold mb-2">{data.bestLeverage.playerName}</p>
          <p className="text-sm text-muted-foreground mb-2">{data.bestLeverage.reason}</p>
          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(data.bestLeverage.confidence)}`}>
            {(data.bestLeverage.confidence * 100).toFixed(0)}% Confidence
          </div>
        </Card>

        {/* Best Fade */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold">Best Fade</h3>
          </div>
          <p className="text-lg font-bold mb-2">{data.bestFade.playerName}</p>
          <p className="text-sm text-muted-foreground mb-2">{data.bestFade.reason}</p>
          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(data.bestFade.confidence)}`}>
            {(data.bestFade.confidence * 100).toFixed(0)}% Confidence
          </div>
        </Card>

        {/* Best Cash Play */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold">Best Cash Play</h3>
          </div>
          <p className="text-lg font-bold mb-2">{data.bestCashPlay.playerName}</p>
          <p className="text-sm text-muted-foreground mb-2">{data.bestCashPlay.reason}</p>
          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(data.bestCashPlay.confidence)}`}>
            {(data.bestCashPlay.confidence * 100).toFixed(0)}% Confidence
          </div>
        </Card>
      </div>

      {/* Best GPP Play */}
      <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-pink-500" />
          <h3 className="font-semibold text-lg">Best GPP Play</h3>
        </div>
        <p className="text-xl font-bold mb-2">{data.bestGppPlay.playerName}</p>
        <p className="text-sm text-muted-foreground mb-3">{data.bestGppPlay.reason}</p>
        <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getConfidenceColor(data.bestGppPlay.confidence)}`}>
          {(data.bestGppPlay.confidence * 100).toFixed(0)}% Confidence
        </div>
      </Card>
    </div>
  )
}
