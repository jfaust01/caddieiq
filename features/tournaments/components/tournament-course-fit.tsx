'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CourseFitTrait {
  name: string
  stars: number // 1-5
  importance: 'Critical' | 'Very Important' | 'Important' | 'Moderate' | 'Minor'
  explanation: string
  icon?: string
}

interface TournamentCourseFitProps {
  traits: CourseFitTrait[]
}

/**
 * Tournament Course Fit component.
 * Shows which player skills are most critical at this venue.
 * Helps answer: "What kind of player wins here?"
 */
export function TournamentCourseFit({ traits }: TournamentCourseFitProps) {
  if (traits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Fit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Course fit analysis not yet available.</p>
        </CardContent>
      </Card>
    )
  }

  // Sort by importance
  const importanceOrder = {
    'Critical': 5,
    'Very Important': 4,
    'Important': 3,
    'Moderate': 2,
    'Minor': 1,
  }

  const sortedTraits = [...traits].sort(
    (a, b) => importanceOrder[b.importance] - importanceOrder[a.importance],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Fit</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Skills that matter most at this venue
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTraits.map((trait, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{trait.name}</div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`size-4 rounded-sm ${
                        i < trait.stars ? 'bg-yellow-500' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div
                  className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                    trait.importance === 'Critical'
                      ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                      : trait.importance === 'Very Important'
                        ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400'
                        : trait.importance === 'Important'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                          : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {trait.importance}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {trait.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
