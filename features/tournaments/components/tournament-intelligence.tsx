import { Brain, CloudSun, Gauge, Target, Users } from 'lucide-react'

import { SectionHeader } from '@/components/shared/section-header'
import { ComingSoonCard } from '@/features/tournaments/components/coming-soon-card'

/**
 * The decision-support layer: the analytical read on an event that tells a user
 * why they should care. Every card is a reserved placeholder today and lights
 * up as its underlying feed (field, weather, course, model output, AI) is
 * imported — so the section already communicates the finished experience.
 */
export function TournamentIntelligence() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Tournament intelligence"
        description="The analytical read on this event — field strength, conditions, and projections that shape your picks."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ComingSoonCard
          icon={Users}
          title="Field strength"
          metricLabel="—"
          description="Depth and quality of the committed field, weighted by world ranking and recent form."
        />
        <ComingSoonCard
          icon={CloudSun}
          title="Weather impact"
          metricLabel="—"
          description="How forecast wind, rain, and temperature are expected to move scoring across the week."
        />
        <ComingSoonCard
          icon={Gauge}
          title="Course difficulty"
          metricLabel="—"
          description="Historical scoring difficulty and the skills this venue rewards most."
        />
        <ComingSoonCard
          icon={Target}
          title="Projected winning score"
          metricLabel="—"
          description="Model-projected winning total based on course, conditions, and field."
        />
      </div>

      <ComingSoonCard
        icon={Brain}
        title="AI tournament summary"
        description="A narrative preview generated from the field, course fit, conditions, and market — the story of the week in a few sentences, grounded in your data."
      />
    </section>
  )
}
