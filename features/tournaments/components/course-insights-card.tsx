'use client'

import { AlertCircle, Target, Award, Activity, Zap, Wind, AlertTriangle, TrendingUp, Droplet, Navigation, Smile, ChevronRight } from 'lucide-react'

import { SectionHeader } from '@/components/shared/section-header'
import type { CourseInsightRecord } from '@/lib/course-intelligence/insights/types'

// Icon map for dynamic rendering
const ICON_MAP: Record<string, React.ReactNode> = {
  'trophy': <Award className="size-5 text-amber-500" aria-hidden />,
  'award': <Award className="size-5 text-amber-500" aria-hidden />,
  'target': <Target className="size-5 text-blue-500" aria-hidden />,
  'smile': <Smile className="size-5 text-green-500" aria-hidden />,
  'thumbs-up': <Smile className="size-5 text-green-500" aria-hidden />,
  'zap': <Zap className="size-5 text-yellow-500" aria-hidden />,
  'crosshair': <Target className="size-5 text-blue-500" aria-hidden />,
  'activity': <Activity className="size-5 text-purple-500" aria-hidden />,
  'navigation': <Navigation className="size-5 text-slate-500" aria-hidden />,
  'info': <AlertCircle className="size-5 text-slate-400" aria-hidden />,
  'droplet': <Droplet className="size-5 text-cyan-500" aria-hidden />,
  'alert-circle': <AlertCircle className="size-5 text-red-500" aria-hidden />,
  'alert-triangle': <AlertTriangle className="size-5 text-orange-500" aria-hidden />,
  'trending-up': <TrendingUp className="size-5 text-green-500" aria-hidden />,
  'arrow-up': <TrendingUp className="size-5 text-green-500" aria-hidden />,
  'trending-down': <TrendingUp className="size-5 text-red-500" style={{ transform: 'scaleY(-1)' }} aria-hidden />,
  'chevron-down': <ChevronRight className="size-5 text-slate-500" style={{ transform: 'rotate(90deg)' }} aria-hidden />,
  'wind': <Wind className="size-5 text-cyan-400" aria-hidden />,
}

function getIconElement(iconName: string): React.ReactNode {
  return ICON_MAP[iconName] || <AlertCircle className="size-5 text-slate-400" aria-hidden />
}

// Importance badge styling
function getImportanceBadgeColor(importance: number): string {
  switch (importance) {
    case 5:
      return 'bg-red-500/20 text-red-700 border border-red-200'
    case 4:
      return 'bg-amber-500/20 text-amber-700 border border-amber-200'
    case 3:
      return 'bg-blue-500/20 text-blue-700 border border-blue-200'
    case 2:
      return 'bg-slate-500/20 text-slate-700 border border-slate-200'
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200'
  }
}

function getImportanceLabel(importance: number): string {
  switch (importance) {
    case 5:
      return 'Critical'
    case 4:
      return 'High'
    case 3:
      return 'Moderate'
    case 2:
      return 'Low'
    default:
      return 'Info'
  }
}

export interface CourseInsightsCardProps {
  insights: CourseInsightRecord[]
}

/**
 * Course Insights Card
 *
 * Displays generated insights derived from Course Intelligence metrics.
 * Each insight includes title, summary, importance badge, and icon.
 */
export function CourseInsightsCard({ insights }: CourseInsightsCardProps) {
  if (!insights || insights.length === 0) {
    return (
      <div className="space-y-3">
        <SectionHeader title="Course Insights" description="AI-powered intelligence" />
        <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Insights will be available once course data is fully imported.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Course Insights" description="AI-powered intelligence" />
      
      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="flex gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card/80"
          >
            {/* Icon */}
            <div className="mt-1 flex-shrink-0">
              {getIconElement(insight.icon)}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{insight.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {insight.summary}
                  </p>
                </div>

                {/* Importance badge */}
                <div className="flex-shrink-0">
                  <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${getImportanceBadgeColor(insight.importance)}`}>
                    {getImportanceLabel(insight.importance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground">
        {insights.length} insights generated from course data analysis
      </div>
    </div>
  )
}
