/**
 * Tournament Course Intelligence Wrapper.
 *
 * Server component that fetches course intelligence and renders the card.
 */

import { getTournamentCourseIntelligence } from "@/lib/course-intelligence"
import { CourseIntelligenceCard } from "./course-intelligence-card"

interface TournamentCourseIntelligenceWrapperProps {
  tournamentId: string
}

/**
 * Fetch course intelligence for tournament and render card.
 */
export async function TournamentCourseIntelligenceWrapper({
  tournamentId,
}: TournamentCourseIntelligenceWrapperProps) {
  const intelligence = await getTournamentCourseIntelligence(tournamentId)

  if (!intelligence) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Course intelligence not available. Course data may not be fully imported yet.
        </p>
      </div>
    )
  }

  return <CourseIntelligenceCard intelligence={intelligence} />
}
