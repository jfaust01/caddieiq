import { courseService } from '@/features/courses/services/course-service'
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
  profile: CourseProfile
}

/**
 * Premium Course Intelligence hub: 8-component dashboard that transforms
 * GolfCourseAPI data into actionable fantasy golf insights.
 *
 * Fetches CourseDetails (per-hole, facilities, architect) on the server,
 * computes difficulty/characteristics/takeaways via tournament-service utilities,
 * then orchestrates 8 specialized components into a cohesive dashboard.
 */
export async function CourseIntelligenceHub({
  courseId,
  courseName,
  profile,
}: CourseIntelligenceHubProps) {
  // Fetch course details (holes, architect, facilities, etc.) from repository
  const courseDetails = await courseService.getCourseDetails(courseId)

  // Compute derived analytics using tournament-service utilities
  const difficulty = tournamentService.computeCourseDifficulty(profile)
  const characteristics = tournamentService.extractCourseCharacteristics(profile)
  const takeaways = tournamentService.generateFantasyTakeaways(profile, courseDetails)

  // Hard-coded archetypes for now; could be enhanced to use player skill data
  const bestFits = [
    'Long Hitters with Accuracy',
    'Elite Putters',
    'Precision Ball Strikers',
    'Short Game Specialists',
    'Wind Managers',
  ]
  const potentialFades = ['Pure Bombers', 'Wind-Sensitive Players']

  // Mock hole breakdown - would come from courseDetails.holes
  const holes = Array.from({ length: 18 }, (_, i) => ({
    number: i + 1,
    par: i < 9 ? (Math.random() > 0.5 ? 3 : 4) : Math.random() > 0.5 ? 4 : 5,
    yardage: 350 + Math.random() * 250,
    handicap: Math.floor(Math.random() * 18) + 1,
  }))

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section>
        <CourseHeroSummary courseName={courseName} profile={profile} courseDetails={courseDetails} />
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
        <CourseFactsCard profile={profile} courseDetails={courseDetails} />
      </section>
    </div>
  )
}
