'use client'

import { SectionHeader } from '@/components/shared/section-header'
import { FieldStrengthCard } from './field-strength-card'
import { WeatherImpactCard } from './weather-impact-card'
import { DfsStrategyCard } from './dfs-strategy-card'
import { RiskFactorsCard } from './risk-factors-card'
import { PremiumInsightsList } from './premium-insights-list'
import type {
  DfsStrategyRecommendations,
  FieldStrengthAnalysis,
  PremiumInsight,
  RiskFactor,
  WeatherImpactAnalysis,
} from '@/features/tournaments/utils/tournament-elevation'

interface TournamentElevationHubProps {
  /** Field strength analysis */
  fieldStrength: FieldStrengthAnalysis
  /** Weather impact analysis */
  weatherImpact: WeatherImpactAnalysis
  /** DFS strategy recommendations */
  strategy: DfsStrategyRecommendations
  /** Risk factors */
  risks: RiskFactor[]
  /** Premium insights */
  insights: PremiumInsight[]
}

/**
 * Tournament Elevation Hub - orchestrates all premium research components.
 * Provides comprehensive strategic guidance for DFS lineups and player selection.
 */
export function TournamentElevationHub({
  fieldStrength,
  weatherImpact,
  strategy,
  risks,
  insights,
}: TournamentElevationHubProps) {
  return (
    <section className="flex flex-col gap-8">
      <SectionHeader
        as="h3"
        title="Tournament Strategy"
        description="Premium analytics to guide DFS strategy and player selection"
      />

      {/* Main Grid - Field Strength and Weather Impact */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <FieldStrengthCard analysis={fieldStrength} />
        <WeatherImpactCard analysis={weatherImpact} />
      </div>

      {/* DFS Strategy */}
      <DfsStrategyCard strategy={strategy} />

      {/* Risk Factors */}
      <RiskFactorsCard risks={risks} />

      {/* Premium Insights */}
      <PremiumInsightsList insights={insights} />
    </section>
  )
}
