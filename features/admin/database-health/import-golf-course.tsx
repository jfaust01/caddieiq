'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { importCourseIntelligenceAction } from '@/app/actions/import-golfcourse'
import type { CourseImportSummary } from '@/lib/types/course-import'

export function ImportGolfCourse() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    summary?: CourseImportSummary
    error?: string
  } | null>(null)

  async function handleImport() {
    setIsLoading(true)
    setResult(null)

    try {
      const res = await importCourseIntelligenceAction()
      if (res.success && res.result) {
        setResult({ summary: res.result })
      } else {
        setResult({ error: res.error })
      }
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <h3 className="font-semibold">Golf Course Import</h3>
        <p className="text-sm text-muted-foreground">
          Enrich verified tournaments with course details, holes, and tee information from GolfCourse API
        </p>
      </div>

      <Button onClick={handleImport} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Importing...
          </>
        ) : (
          'Start Import'
        )}
      </Button>

      {result && (
        <div className="space-y-3 rounded bg-muted p-4 text-sm">
          {result.error ? (
            <>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="size-4 flex-shrink-0" />
                <span className="font-semibold">Import Failed</span>
              </div>
              <p>{result.error}</p>
              {result.summary && (
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-xs font-semibold">Partial Results:</p>
                  <dl className="grid gap-1 text-xs">
                    <div className="flex justify-between">
                      <span>Courses Imported:</span>
                      <span className="font-mono font-semibold">{result.summary.coursesImported}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Courses Updated:</span>
                      <span className="font-mono font-semibold">{result.summary.coursesUpdated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Holes Imported:</span>
                      <span className="font-mono font-semibold">{result.summary.holesImported}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tee Boxes Imported:</span>
                      <span className="font-mono font-semibold">{result.summary.teeBoxesImported}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-mono font-semibold">{formatDuration(result.summary.durationMs)}</span>
                    </div>
                  </dl>
                </div>
              )}
            </>
          ) : result.summary ? (
            <>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="size-4 flex-shrink-0" />
                <span className="font-semibold">Import Complete</span>
              </div>

              {/* Summary Stats */}
              <dl className="grid gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Courses Considered:</span>
                  <span className="font-mono font-semibold">{result.summary.coursesConsidered}</span>
                </div>
                <div className="flex justify-between">
                  <span>Courses Matched:</span>
                  <span className="font-mono font-semibold">{result.summary.coursesMatched}</span>
                </div>
                <div className="flex justify-between">
                  <span>Courses Imported:</span>
                  <span className="font-mono font-semibold">{result.summary.coursesImported}</span>
                </div>
                <div className="flex justify-between">
                  <span>Courses Updated:</span>
                  <span className="font-mono font-semibold">{result.summary.coursesUpdated}</span>
                </div>
              </dl>

              {/* Hole Records */}
              <div className="border-t border-border pt-2">
                <p className="mb-2 text-xs font-semibold">Hole Records</p>
                <dl className="grid gap-1 text-xs">
                  <div className="flex justify-between">
                    <span>Holes Imported:</span>
                    <span className="font-mono font-semibold">{result.summary.holesImported}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Holes Updated:</span>
                    <span className="font-mono font-semibold">{result.summary.holesUpdated}</span>
                  </div>
                </dl>
              </div>

              {/* Tee Boxes */}
              <div className="border-t border-border pt-2">
                <p className="mb-2 text-xs font-semibold">Tee Boxes</p>
                <dl className="grid gap-1 text-xs">
                  <div className="flex justify-between">
                    <span>Tee Boxes Imported:</span>
                    <span className="font-mono font-semibold">{result.summary.teeBoxesImported}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tee Boxes Updated:</span>
                    <span className="font-mono font-semibold">{result.summary.teeBoxesUpdated}</span>
                  </div>
                </dl>
              </div>

              {/* Duration */}
              <div className="border-t border-border pt-2">
                <div className="flex justify-between text-xs">
                  <span>Duration:</span>
                  <span className="font-mono font-semibold">{formatDuration(result.summary.durationMs)}</span>
                </div>
              </div>

              {/* Warnings */}
              {result.summary.warnings.length > 0 && (
                <div className="border-t border-border pt-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="size-4 flex-shrink-0" />
                    <p className="text-xs font-semibold">Warnings ({result.summary.warnings.length})</p>
                  </div>
                  <ul className="list-inside list-disc space-y-1 pl-4">
                    {result.summary.warnings.slice(0, 5).map((warning, i) => (
                      <li key={i} className="text-xs">
                        {warning}
                      </li>
                    ))}
                    {result.summary.warnings.length > 5 && (
                      <li className="text-xs">... and {result.summary.warnings.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Failures */}
              {result.summary.failures.length > 0 && (
                <div className="border-t border-border pt-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="size-4 flex-shrink-0" />
                    <p className="text-xs font-semibold">Failures ({result.summary.failures.length})</p>
                  </div>
                  <ul className="list-inside list-disc space-y-1 pl-4">
                    {result.summary.failures.slice(0, 5).map((failure, i) => (
                      <li key={i} className="text-xs">
                        {failure}
                      </li>
                    ))}
                    {result.summary.failures.length > 5 && (
                      <li className="text-xs">... and {result.summary.failures.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
