'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Lightbulb, Sparkles } from 'lucide-react'

interface TournamentAiBriefProps {
  tournamentName: string
  brief: string
  keyTakeaway: string
  playerArchetypes: string[]
  dfsConsideration?: string
  isLoading?: boolean
}

/**
 * Tournament AI Brief component.
 * Displays professional AI-generated tournament summary.
 * This is the headline section that answers: "How should I attack this tournament?"
 */
export function TournamentAiBrief({
  tournamentName,
  brief,
  keyTakeaway,
  playerArchetypes,
  dfsConsideration,
  isLoading = false,
}: TournamentAiBriefProps) {
  return (
    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-lg">Tournament Brief: {tournamentName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-20 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        ) : (
          <>
            {/* Main Brief */}
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-foreground">{brief}</p>
            </div>

            {/* Key Takeaway */}
            <div className="border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20 px-4 py-3 rounded-r">
              <div className="flex items-start gap-2">
                <Lightbulb className="size-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-yellow-900 dark:text-yellow-300 uppercase">
                    Key Takeaway
                  </div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    {keyTakeaway}
                  </p>
                </div>
              </div>
            </div>

            {/* Player Archetypes */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Players That Win Here
              </div>
              <div className="flex flex-wrap gap-2">
                {playerArchetypes.map((archetype, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 text-xs font-medium"
                  >
                    {archetype}
                  </div>
                ))}
              </div>
            </div>

            {/* DFS Consideration */}
            {dfsConsideration && (
              <div className="border-l-4 border-green-500 bg-green-50/50 dark:bg-green-950/20 px-4 py-3 rounded-r">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-green-900 dark:text-green-300 uppercase">
                      DFS Note
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      {dfsConsideration}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
