'use client'

import { Info, Zap } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DfsStrategyRecommendations } from '@/features/tournaments/utils/tournament-elevation'

interface DfsStrategyCardProps {
  strategy: DfsStrategyRecommendations
  className?: string
}

/**
 * DFS Strategy Card - game-type specific recommendations for cash, GPP, and large field tournaments.
 * Guides lineup construction based on tournament format and field characteristics.
 */
export function DfsStrategyCard({ strategy, className }: DfsStrategyCardProps) {
  const gameTypes = [
    {
      name: 'Cash Games',
      icon: '💰',
      strategy: strategy.cash,
      color: 'border-green-500/30 bg-green-500/5',
      description: 'Low variance - prioritize consistency and chalk',
    },
    {
      name: 'GPP / Large Field',
      icon: '🎯',
      strategy: strategy.gpp,
      color: 'border-blue-500/30 bg-blue-500/5',
      description: 'High variance - seek contrarian value plays',
    },
    {
      name: 'Single Entry',
      icon: '⭐',
      strategy: strategy.singleEntry,
      color: 'border-purple-500/30 bg-purple-500/5',
      description: 'Balanced approach - no stacking',
    },
  ]

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-primary" aria-hidden />
          <CardTitle>DFS Strategy</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {gameTypes.map((game) => (
            <div
              key={game.name}
              className={cn('rounded-lg border p-4', game.color)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-semibold">{game.name}</div>
                  <div className="text-xs text-muted-foreground">{game.description}</div>
                </div>
                <span className="text-lg">{game.icon}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="font-medium text-muted-foreground">Primary</div>
                  <div className="text-foreground">{game.strategy.primary}</div>
                </div>

                <div>
                  <div className="font-medium text-muted-foreground">Secondary</div>
                  <div className="text-foreground">{game.strategy.secondary}</div>
                </div>

                {game.name === 'GPP / Large Field' && (
                  <div>
                    <div className="font-medium text-muted-foreground">Target Ownership</div>
                    <div className="text-foreground">{(game.strategy as any).targetOwnership}</div>
                  </div>
                )}

                {game.name === 'Cash Games' && (
                  <div>
                    <div className="font-medium text-muted-foreground">Avoidance</div>
                    <div className="text-foreground">{(game.strategy as any).avoidance}</div>
                  </div>
                )}

                {game.name === 'Single Entry' && (
                  <div>
                    <div className="font-medium text-muted-foreground">Tiebreaker</div>
                    <div className="text-foreground">{(game.strategy as any).tiebreaker}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Key Principle */}
        <div className="flex gap-2 rounded-lg bg-blue-500/5 p-3">
          <Info className="size-4 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden />
          <p className="text-xs text-muted-foreground">
            Cash = consistency + chalk. GPP = contrarian + leverage. Match your game type strategy to the field strength and course characteristics.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
