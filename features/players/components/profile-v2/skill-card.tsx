'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface SkillEntry {
  /** Label (e.g., "Off the Tee"). */
  label: string
  /** Percentile rank or absolute metric (0-100). */
  value: number
  /** Optional percentile display (e.g., "92nd percentile"). */
  percentile?: string
}

export interface SkillCardProps {
  title: string
  skills: SkillEntry[]
  /** Optional subtitle or description. */
  subtitle?: string
  /** Additional CSS classes. */
  className?: string
}

/**
 * Reusable card displaying a breakdown of player skills with progress bars.
 * Commonly used for Strokes Gained breakdown and approach/putting metrics.
 */
export function SkillCard({
  title,
  skills,
  subtitle,
  className,
}: SkillCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && (
          <p className="text-sm text-muted-foreground pt-1">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {skills.map((skill, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{skill.label}</span>
                {skill.percentile && (
                  <Badge variant="outline" className="text-xs">
                    {skill.percentile}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-muted-foreground w-8 text-right">
                  {skill.value}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
