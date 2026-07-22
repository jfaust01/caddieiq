import { Card } from '@/components/ui/card'
import { tournamentService } from '@/features/tournaments/services/tournament-service'
import { CourseHeroSummary } from './course-intelligence/course-hero-summary'
import { SkillImportanceGrid } from './course-intelligence/skill-importance-grid'
import { CourseDifficultyMeter } from './course-intelligence/course-difficulty-meter'
import { CourseCharacteristics } from './course-intelligence/course-characteristics'
import { FantasyTakeaways } from './course-intelligence/fantasy-takeaways'
import { IdealPlayerProfile } from './course-intelligence/ideal-player-profile'
import { HoleBreakdown } from './course-intelligence/hole-breakdown'
import { CourseFactsCard } from './course-intelligence/course-facts-card'
import type { CourseProfile } from '@/lib/domain/course'

interface CourseIntelligenceHubProps {
  courseId: string
  courseName: string
  profile: CourseProfile | null
}

/**
 * Premium Course Intelligence hub: 8-component dashboard that transforms
 * GolfCourseAPI data into actionable fantasy golf insights.
 *
 * Gracefully handles missing profile or any errors by displaying a friendly message.
 * All sub-components are defensive against null/missing data.
 */
export async function CourseIntelligenceHub({
  courseId,
  courseName,
  profile,
}: CourseIntelligenceHubProps) {
  // Bail out early if no profile available
  if (!profile) {
    return (
      <Card className="p-6 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Course Intelligence is not available for this tournament. Complete course data has not yet been processed.
        </p>
      </Card>
    )
  }
  try {
    // Compute derived analytics using tournament-service utilities
    // Note: CourseDetails table integration pending migration - for now we skip it
    const difficulty = tournamentService.computeCourseDifficulty(profile)
    const characteristics = tournamentService.extractCourseCharacteristics(profile)
    const takeaways = tournamentService.generateFantasyTakeaways(profile, null)

  // Hard-coded archetypes for now; could be enhanced to use player skill data
  const bestFits = [
    'Long Hitters with Accuracy',
    'Elite Putters',
    'Precision Ball Strikers',
    'Short Game Specialists',
    'Wind Managers',
  ]
  const potentialFades = ['Pure Bombers', 'Wind-Sensitive Players']

  // Hole-by-hole data would come from courseDetails.holes once available
  // For now, pass null to HoleBreakdown component to display unavailable state
  const holes = null

    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <section>
          <CourseHeroSummary courseName={courseName} profile={profile} courseDetails={null} />
        </section>

        {/* Top Row: Difficulty, Characteristics, Takeaways */}
        <section className="grid gap-4 lg:grid-cols-3">
          <CourseDifficultyMeter difficulty={difficulty} />
          <div className="lg:col-span-2">
            <CourseCharacteristics characteristics={characteristics} />
          </div>
        </section>

        {/* Skills & Takeaways */}
        <section className="grid gap-4 lg:grid-cols-2">
          <SkillImportanceGrid profile={profile} />
          <FantasyTakeaways takeaways={takeaways} />
        </section>

        {/* Player Profile Fit */}
        <section>
          <IdealPlayerProfile bestFits={bestFits} potentialFades={potentialFades} />
        </section>

        {/* Hole Breakdown */}
        <section>
          <HoleBreakdown holes={holes} />
        </section>

        {/* Course Facts */}
        <section>
          <CourseFactsCard profile={profile} courseDetails={null} />
        </section>
      </div>
    )
  } catch (error) {
    console.error('[v0] CourseIntelligenceHub error:', error)
    return (
      <Card className="p-6 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Course Intelligence is not available for this tournament. An error occurred while processing course data.
        </p>
      </Card>
    )
  }
}
