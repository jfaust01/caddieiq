import { TrendingUp, Users, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CourseProfile } from "@/lib/domain/course"
import { generateFantasyAnalysis } from "@/features/tournaments/utils/fantasy-analysis"

interface TournamentFantasyAnalysisProps {
  profile: CourseProfile
  courseName: string
}

/**
 * Transform GolfCourseAPI course characteristics into actionable fantasy golf insights.
 * Shows skill importance, player archetypes, and course personality to guide lineup decisions.
 */
export function TournamentFantasyAnalysis({
  profile,
  courseName,
}: TournamentFantasyAnalysisProps) {
  const analysis = generateFantasyAnalysis(profile)

  const importanceColor = (importance: string) => {
    switch (importance) {
      case "Critical":
        return "bg-red-500/15 text-red-600 dark:text-red-400"
      case "High":
        return "bg-orange-500/15 text-orange-600 dark:text-orange-400"
      case "Medium":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400"
      default:
        return "bg-slate-500/15 text-slate-600 dark:text-slate-400"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Course Personality Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Course Personality</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            {courseName} is a <span className="font-semibold">{analysis.coursePersonality}</span> course that rewards specific player archetypes.
          </p>
          <Badge variant="secondary">{analysis.coursePersonality}</Badge>
        </CardContent>
      </Card>

      {/* Skill Importance Grid */}
      <div>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          Skill Importance
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {analysis.skillImportances.map((skill) => (
            <Card key={skill.skill} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-lg">{skill.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{skill.skill}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`flex-shrink-0 ${importanceColor(skill.importance)}`}
                  >
                    {skill.importance}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {skill.explanation}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Favored Archetypes */}
      {analysis.favoredArchetypes.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-500" />
            Favored Archetypes
          </h3>
          <div className="flex flex-col gap-3">
            {analysis.favoredArchetypes.map((archetype) => (
              <Card key={archetype.name} className="overflow-hidden border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="size-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{archetype.name}</p>
                      <p className="text-xs text-muted-foreground">{archetype.description}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed ml-5">
                    {archetype.reasoning}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Faded Archetypes */}
      {analysis.fadedArchetypes.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Users className="size-4 text-slate-500" />
            Consider Fading
          </h3>
          <div className="flex flex-col gap-3">
            {analysis.fadedArchetypes.map((archetype) => (
              <Card key={archetype.name} className="overflow-hidden border-slate-500/20 opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="size-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-muted-foreground">{archetype.name}</p>
                      <p className="text-xs text-muted-foreground">{archetype.description}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed ml-5">
                    {archetype.reasoning}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
