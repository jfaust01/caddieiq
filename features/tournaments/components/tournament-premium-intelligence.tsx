'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Zap, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface InsightSection {
  title: string
  icon: LucideIcon
  content: string
  sources: string[]
  confidence: 'high' | 'medium' | 'low'
}

interface TournamentPremiumIntelligenceProps {
  executive: InsightSection
  trendingUp: InsightSection
  trendingDown: InsightSection
  specialists: InsightSection
  risks: InsightSection
  dfsStrategy: InsightSection
  weatherStrategy: InsightSection
  ownership: InsightSection
  contests: InsightSection
}

const iconMap: Record<string, LucideIcon> = {
  executive: Sparkles,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  specialists: Users,
  risks: AlertTriangle,
  dfsStrategy: Zap,
  weatherStrategy: Zap,
  ownership: Users,
  contests: Sparkles,
}

const confidenceBg: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-green-900/20',
  medium: 'bg-yellow-900/20',
  low: 'bg-gray-900/20',
}

const confidenceText: Record<'high' | 'medium' | 'low', string> = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-gray-400',
}

/**
 * Tournament Premium Intelligence — detailed actionable insights based on real data.
 * Replaces generic AI summary with specific sections citing data sources.
 * Includes: Executive Summary, Trending Players, Course Specialists, Risk Factors,
 * DFS Strategy, Weather Strategy, Ownership Notes, Contest Advice.
 */
export function TournamentPremiumIntelligence({
  executive,
  trendingUp,
  trendingDown,
  specialists,
  risks,
  dfsStrategy,
  weatherStrategy,
  ownership,
  contests,
}: TournamentPremiumIntelligenceProps) {
  const sections: Array<[string, InsightSection]> = [
    ['executive', executive],
    ['trendingUp', trendingUp],
    ['trendingDown', trendingDown],
    ['specialists', specialists],
    ['risks', risks],
    ['dfsStrategy', dfsStrategy],
    ['weatherStrategy', weatherStrategy],
    ['ownership', ownership],
    ['contests', contests],
  ]

  return (
    <section aria-label="Tournament premium intelligence">
      <SectionHeader
        title="Tournament Intelligence"
        description="Data-driven insights for this specific event"
        icon={Sparkles}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sections.map(([key, section]) => {
          const Icon = iconMap[key] || Sparkles

          return (
            <Card key={key} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground shrink-0" />
                    <CardTitle className="text-sm">{section.title}</CardTitle>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${confidenceBg[section.confidence]} ${confidenceText[section.confidence]}`}
                  >
                    {section.confidence}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm leading-relaxed text-pretty mb-3 flex-1">
                  {section.content}
                </p>

                {/* Data Sources */}
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Based on:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {section.sources.map((source, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Key Takeaways */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Key Takeaways</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-chart-1 shrink-0" />
              <span className="text-sm">
                Focus on players with course-specific expertise based on historical data
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-chart-2 shrink-0" />
              <span className="text-sm">
                Weather conditions will influence player selection and game style
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-chart-3 shrink-0" />
              <span className="text-sm">
                Consider ownership patterns when building contrarian lineups
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
