import { tournamentService } from '@/features/tournaments/services/tournament-service'
import { SectionHeader } from '@/components/shared/section-header'
import { SkillImportanceCards } from './skill-importance-cards'
import { CourseDifficultyExpanded } from './course-difficulty-expanded'
import { FantasyTakeawayCards } from './fantasy-takeaway-cards'
import { PlayerArchetypeList } from './player-archetype-list'
import { StrategySummary } from './strategy-summary'
import { CourseFactsCard } from './course-facts-card'
import type { CourseProfile } from '@/lib/domain/course'

interface CourseIntelligencePremiumProps {
  profile: CourseProfile
  courseName: string
}

/**
 * Premium Course Intelligence orchestrator: brings together skill importance,
 * difficulty analysis, strategic guidance, player archetypes, and course facts
 * into a cohesive premium analytics experience.
 */
export async function CourseIntelligencePremium({
  profile,
  courseName,
}: CourseIntelligencePremiumProps) {
  // Compute all premium analytics on the server
  const difficulty = tournamentService.computeCourseDifficulty(profile)
  const characteristics = tournamentService.extractCourseCharacteristics(profile)
  const takeaways = tournamentService.generateFantasyTakeaways(profile, null)
  const skillExplanations = tournamentService.getSkillImportanceExplanations(profile)
  const strategySummary = tournamentService.generateStrategySummary(profile, courseName)
  const archetypes = tournamentService.generatePlayerArchetypes(profile)

  return (
    <div className="space-y-8">
      {/* Strategy Overview */}
      <section className="space-y-3">
        <SectionHeader
          as="h3"
          title="Strategic Overview"
          description="How this course impacts player selection and lineup strategy"
        />
        <StrategySummary summary={strategySummary} />
      </section>

      {/* Skill Importance & Course Difficulty */}
      <section className="space-y-4">
        <SectionHeader
          as="h3"
          title="Skill Importance & Difficulty"
          description="Which skills matter most and what makes this course challenging"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <SkillImportanceCards skillExplanations={skillExplanations} />
          </div>
          <div>
            <CourseDifficultyExpanded
              difficulty={difficulty}
              skillExplanations={skillExplanations}
            />
          </div>
        </div>
      </section>

      {/* DFS Takeaways */}
      {takeaways.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            as="h3"
            title="Key Insights"
            description="What you need to know for optimal lineup construction"
          />
          <FantasyTakeawayCards takeaways={takeaways} />
        </section>
      )}

      {/* Player Archetypes */}
      <section className="space-y-3">
        <SectionHeader
          as="h3"
          title="Player Archetypes"
          description="Who thrives and who struggles at this course"
        />
        <PlayerArchetypeList
          bestFits={archetypes.bestFits}
          potentialFades={archetypes.potentialFades}
        />
      </section>

      {/* Course Facts Reference */}
      <section className="space-y-3">
        <SectionHeader as="h3" title="Course Reference" />
        <CourseFactsCard courseName={courseName} courseProfile={profile} />
      </section>
    </div>
  )
}
