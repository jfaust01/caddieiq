'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock } from 'lucide-react'

interface ImportProgressProps {
  isImporting: boolean
  isComplete: boolean
  duration?: number
}

const steps = [
  'Connecting to GolfCourseAPI...',
  'Downloading course data...',
  'Parsing response...',
  'Mapping fields...',
  'Saving to database...',
  'Refreshing cache...',
]

export function ImportProgress({
  isImporting,
  isComplete,
  duration,
}: ImportProgressProps) {
  if (!isImporting && !isComplete) {
    return null
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {isComplete ? (
            <>
              <CheckCircle2 className="size-4 text-green-600" />
              Import Complete
            </>
          ) : (
            <>
              <Clock className="size-4 animate-spin" />
              Importing...
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isComplete ? (
          <div className="text-sm">
            <p className="text-muted-foreground">
              Completed in {duration ? `${(duration / 1000).toFixed(1)}s` : '—'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-2 text-sm"
              >
                <div className="size-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
