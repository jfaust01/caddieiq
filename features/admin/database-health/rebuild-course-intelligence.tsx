'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { rebuildCourseIntelligence } from './actions/rebuild-course-intelligence'

interface RebuildState {
  isRunning: boolean
  isComplete: boolean
  success: boolean
  stats?: {
    totalCourses: number
    enrichedCount: number
    skippedCount: number
    createdCount: number
    updatedCount: number
    errors: Array<{
      courseId: string
      error: string
    }>
  }
  error?: string
}

export function RebuildCourseIntelligence() {
  const [state, setState] = useState<RebuildState>({
    isRunning: false,
    isComplete: false,
    success: false,
  })

  const handleRebuild = async () => {
    setState({ isRunning: true, isComplete: false, success: false })

    try {
      const result = await rebuildCourseIntelligence()

      if (result.success && result.stats) {
        setState({
          isRunning: false,
          isComplete: true,
          success: true,
          stats: result.stats,
        })
      } else {
        setState({
          isRunning: false,
          isComplete: true,
          success: false,
          error: result.error || 'Unknown error',
        })
      }
    } catch (error) {
      setState({
        isRunning: false,
        isComplete: true,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleReset = () => {
    setState({
      isRunning: false,
      isComplete: false,
      success: false,
    })
  }

  const stats = state.stats
  const hasErrors = stats && stats.errors.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="size-5" />
          Rebuild Course Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Regenerate course characteristics (style, importance weights, etc.) from verified course data.
          This operation is safe to run repeatedly.
        </p>

        {!state.isComplete ? (
          <Button
            onClick={handleRebuild}
            disabled={state.isRunning}
            className="w-full gap-2"
          >
            {state.isRunning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Running enrichment...
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                Start Rebuild
              </>
            )}
          </Button>
        ) : (
          <>
            {state.success && stats ? (
              <div className="space-y-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                  <span className="font-medium">Rebuild completed successfully</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                  <div>
                    <div className="text-muted-foreground">Total Courses</div>
                    <div className="font-mono text-lg font-bold">{stats.totalCourses}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Enriched</div>
                    <div className="font-mono text-lg font-bold">{stats.enrichedCount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Created</div>
                    <div className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.createdCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Updated</div>
                    <div className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                      {stats.updatedCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Skipped</div>
                    <div className="font-mono text-lg font-bold">{stats.skippedCount}</div>
                  </div>
                  {stats.errors.length > 0 && (
                    <div>
                      <div className="text-muted-foreground">Errors</div>
                      <div className="font-mono text-lg font-bold text-destructive">{stats.errors.length}</div>
                    </div>
                  )}
                </div>

                {hasErrors && (
                  <div className="border-t border-emerald-200 dark:border-emerald-800 pt-3">
                    <div className="mb-2 text-sm font-medium text-muted-foreground">Error Summary</div>
                    <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                      {stats.errors.slice(0, 5).map((err, i) => (
                        <div key={i} className="text-destructive">
                          <span className="font-mono">{err.courseId}:</span> {err.error}
                        </div>
                      ))}
                      {stats.errors.length > 5 && (
                        <div className="text-muted-foreground">... and {stats.errors.length - 5} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 rounded-lg bg-destructive/10 p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="size-5" />
                  <span className="font-medium">Rebuild failed</span>
                </div>
                <p className="text-sm text-destructive/80">{state.error}</p>
              </div>
            )}

            <Button onClick={handleReset} variant="outline" className="w-full">
              Reset
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
