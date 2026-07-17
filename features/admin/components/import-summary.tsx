'use client'

import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GolfCourseImportResult } from '@/lib/admin/golfcourse-import-types'

interface ImportSummaryProps {
  result: GolfCourseImportResult
}

export function ImportSummary({ result }: ImportSummaryProps) {
  const updatedCount = Object.keys(result.updatedFields).length
  const skippedCount = Object.keys(result.skippedFields).length
  const hasErrors = result.errors.length > 0

  return (
    <Card className={
      hasErrors
        ? 'border-destructive/50 bg-destructive/5'
        : 'border-green-500/50 bg-green-50 dark:bg-green-950/10'
    }>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {hasErrors ? (
            <>
              <AlertTriangle className="size-4 text-destructive" />
              Import Failed
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4 text-green-600" />
              Import Summary
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-mono text-sm">
              {(result.duration / 1000).toFixed(1)}s
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Updated Fields</p>
            <p className="font-mono text-sm">{updatedCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Skipped Fields</p>
            <p className="font-mono text-sm">{skippedCount}</p>
          </div>
        </div>

        {updatedCount > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-medium text-green-700 dark:text-green-400">
              Updated ({updatedCount})
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.keys(result.updatedFields).map((field) => (
                <Badge key={field} variant="outline" className="bg-green-50 dark:bg-green-950/30">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {skippedCount > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Skipped ({skippedCount})
            </p>
            <div className="space-y-1">
              {Object.entries(result.skippedFields).map(([field, info]) => (
                <div key={field} className="text-xs text-muted-foreground">
                  <span className="font-medium">{field}</span>
                  <span className="ml-2 text-muted-foreground">
                    Reason: {info.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.warnings.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="size-3" />
              Warnings ({result.warnings.length})
            </p>
            <ul className="space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index} className="text-xs text-muted-foreground">
                  • {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.errors.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-medium text-destructive flex items-center gap-1">
              <AlertCircle className="size-3" />
              Errors ({result.errors.length})
            </p>
            <ul className="space-y-1">
              {result.errors.map((error, index) => (
                <li key={index} className="text-xs text-muted-foreground">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
