import { TournamentHealthCard, type HealthItem } from './tournament-health-card'
import { prisma } from '@/lib/prisma'
import { getCourseDetailsRepository } from '@/lib/repositories/course-details-repository'
import { getCourseIntelligenceRepository } from '@/lib/repositories/course-intelligence-repository'
import { getCourseInsightRepository } from '@/lib/repositories/course-insight-repository'
import { getCourseMetricExplanationRepository } from '@/lib/repositories/course-metric-explanation-repository'
import type { TournamentSummary } from '@/features/tournaments/types'

interface TournamentHealthWrapperProps {
  tournament: TournamentSummary
  weatherStatus?: 'available' | 'pending' | 'unavailable' | 'error'
  oddsStatus?: 'available' | 'pending' | 'unavailable' | 'error'
  hasHistoricalResults?: boolean
}

/**
 * Server wrapper that gathers health status for all tournament data layers
 * and renders the Tournament Health card.
 */
export async function TournamentHealthWrapper({
  tournament,
  weatherStatus = 'pending',
  oddsStatus = 'pending',
  hasHistoricalResults = false,
}: TournamentHealthWrapperProps) {
  try {
    const courseRef = tournament.courseRef
    const items: HealthItem[] = []

    // Tournament Data
    items.push({
      label: 'Tournament Data',
      status: tournament.status === 'active' ? 'complete' : 'pending',
    })

    // Course Mapping
    const mapping = courseRef ? 'complete' : 'not-imported'
    items.push({
      label: 'Course Mapping',
      status: mapping,
    })

    // Course Details
    if (courseRef) {
      try {
        const courseDetailsRepo = getCourseDetailsRepository(prisma)
        const courseResult = await courseDetailsRepo.findById(courseRef.id)
        items.push({
          label: 'Course Details',
          status: courseResult.outcome === 'ok' && courseResult.record ? 'complete' : 'not-imported',
        })

        // Hole Data & Tee Boxes
        if (courseResult.outcome === 'ok' && courseResult.record) {
          const holesCount = await prisma.hole.count({
            where: { courseId: courseRef.id },
          })
          const teeBoxesCount = await prisma.teeBox.count({
            where: { courseId: courseRef.id },
          })

          items.push({
            label: 'Hole Data',
            status: holesCount > 0 ? 'complete' : 'not-imported',
          })

          items.push({
            label: 'Tee Boxes',
            status: teeBoxesCount > 0 ? 'complete' : 'not-imported',
          })

          // Course Intelligence
          try {
            const intelligenceRepo = getCourseIntelligenceRepository(prisma)
            const intelligence = await intelligenceRepo.findByCourseId(courseRef.id)
            items.push({
              label: 'Course Intelligence',
              status: intelligence ? 'complete' : 'not-generated',
            })

            // Course Insights
              if (intelligence) {
                try {
                  const insightRepo = getCourseInsightRepository(prisma)
                const insights = await insightRepo.findByCourseIntelligence(intelligence.id)
                items.push({
                  label: 'Course Insights',
                  status: insights && insights.length > 0 ? 'complete' : 'not-generated',
                })

                // Course Explanations
                try {
                  const explanationRepo = getCourseMetricExplanationRepository(prisma)
                  const explanations = await explanationRepo.findByCourseIntelligence(intelligence.id)
                  items.push({
                    label: 'Course Explanations',
                    status: explanations && explanations.length > 0 ? 'complete' : 'not-generated',
                  })
                } catch {
                  items.push({
                    label: 'Course Explanations',
                    status: 'error',
                  })
                }
              } catch {
                items.push({
                  label: 'Course Insights',
                  status: 'error',
                })
              }
            } else {
              items.push({
                label: 'Course Insights',
                status: 'not-generated',
              })
              items.push({
                label: 'Course Explanations',
                status: 'not-generated',
              })
            }
          } catch {
            items.push({
              label: 'Course Intelligence',
              status: 'error',
            })
            items.push({
              label: 'Course Insights',
              status: 'error',
            })
            items.push({
              label: 'Course Explanations',
              status: 'error',
            })
          }
        }
      } catch {
        items.push({
          label: 'Course Details',
          status: 'error',
        })
        items.push({
          label: 'Hole Data',
          status: 'error',
        })
        items.push({
          label: 'Tee Boxes',
          status: 'error',
        })
        items.push({
          label: 'Course Intelligence',
          status: 'error',
        })
        items.push({
          label: 'Course Insights',
          status: 'error',
        })
        items.push({
          label: 'Course Explanations',
          status: 'error',
        })
      }
    } else {
      items.push(
        {
          label: 'Course Details',
          status: 'not-imported',
        },
        {
          label: 'Hole Data',
          status: 'not-imported',
        },
        {
          label: 'Tee Boxes',
          status: 'not-imported',
        },
        {
          label: 'Course Intelligence',
          status: 'not-generated',
        },
        {
          label: 'Course Insights',
          status: 'not-generated',
        },
        {
          label: 'Course Explanations',
          status: 'not-generated',
        }
      )
    }

    // Weather
    const weatherStatusMap: Record<string, 'complete' | 'pending' | 'not-generated'> = {
      'available': 'complete',
      'pending': 'pending',
      'unavailable': 'not-generated',
      'error': 'error',
    }
    items.push({
      label: 'Weather',
      status: (weatherStatusMap[weatherStatus] || 'pending') as any,
    })

    // Odds
    const oddsStatusMap: Record<string, 'complete' | 'pending' | 'not-generated'> = {
      'available': 'complete',
      'pending': 'pending',
      'unavailable': 'not-generated',
      'error': 'error',
    }
    items.push({
      label: 'Odds',
      status: (oddsStatusMap[oddsStatus] || 'pending') as any,
    })

    // Historical Results
    items.push({
      label: 'Historical Results',
      status: hasHistoricalResults ? 'complete' : 'not-imported',
    })

    return <TournamentHealthCard items={items} />
  } catch (error) {
    console.error('[v0] TournamentHealthWrapper error:', error)
    return (
      <div className="text-sm text-muted-foreground">
        Unable to load tournament health status.
      </div>
    )
  }
}
