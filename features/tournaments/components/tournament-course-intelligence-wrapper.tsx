/**
 * Tournament Course Intelligence Wrapper.
 *
 * Server component that fetches course intelligence and renders the card.
 */

import { getTournamentCourseIntelligence } from "@/lib/course-intelligence"
import { CourseIntelligenceCard } from "./course-intelligence-card"
import { StatusBadge } from "./status-badge"
import { Zap } from "lucide-react"

interface TournamentCourseIntelligenceWrapperProps {
  tournamentId: string
}

/**
 * Fetch course intelligence for tournament and render card.
 * Gracefully handles errors by treating them as "not available".
 */
export async function TournamentCourseIntelligenceWrapper({
  tournamentId,
}: TournamentCourseIntelligenceWrapperProps) {
  let intelligence
  try {
    intelligence = await getTournamentCourseIntelligence(tournamentId)
  } catch (error) {
    console.error('[v0] getTournamentCourseIntelligence error:', error)
    intelligence = null
  }

  if (!intelligence) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <Zap className="size-5 shrink-0 text-muted-foreground/50" />
          <div className="flex-1 space-y-2">
            <p className="font-medium text-sm">Course Intelligence Not Yet Generated</p>
            <p className="text-xs text-muted-foreground">
              Course Intelligence is calculated from hole data, tee specifications, and course details.
              Once your course is fully imported, intelligence metrics will be available here.
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <StatusBadge variant="not-generated" label="Not Generated" showIcon />
        </div>
      </div>
    )
  }

  return <CourseIntelligenceCard intelligence={intelligence} />
}
