'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface PlayerArchetype {
  name: string
  description: string
  confidence: number // 0-100
  recentExamples?: string[]
  whyTheyWin: string
}

interface TournamentPlayerArchetypesProps {
  archetypes: PlayerArchetype[]
}

/**
 * Tournament Player Archetypes component.
 * Shows which types of players succeed at this venue.
 * Helps golfers understand "Who wins here and why?"
 */
export function TournamentPlayerArchetypes({
  archetypes,
}: TournamentPlayerArchetypesProps) {
  if (archetypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Archetypes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Player archetype analysis not yet available.</p>
        </CardContent>
      </Card>
    )
  }

  // Sort by confidence descending
  const sortedArchetypes = [...archetypes].sort((a, b) => b.confidence - a.confidence)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="size-5" />
          <CardTitle>Who Wins Here</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Player archetypes that succeed at this venue
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedArchetypes.map((archetype, idx) => (
            <div
              key={idx}
              className="border border-border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sm">{archetype.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{archetype.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-xs font-medium whitespace-nowrap">
                    {archetype.confidence}% fit
                  </div>
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                      style={{ width: `${archetype.confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Why They Win */}
              <div className="bg-muted/40 rounded px-3 py-2">
                <p className="text-xs leading-relaxed text-foreground">
                  {archetype.whyTheyWin}
                </p>
              </div>

              {/* Recent Examples */}
              {archetype.recentExamples && archetype.recentExamples.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Recent Examples
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {archetype.recentExamples.map((example, eIdx) => (
                      <div
                        key={eIdx}
                        className="inline-flex px-2 py-1 rounded bg-muted text-xs text-foreground"
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
