'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GolfCourseImportResult } from '@/lib/admin/golfcourse-import-types'

interface ImportDiffViewerProps {
  result: GolfCourseImportResult
}

const DiffRow = ({
  field,
  before,
  after,
}: {
  field: string
  before: string | number | boolean | null
  after: string | number | boolean | null
}) => {
  const beforeStr =
    before === null || before === undefined ? '—' : String(before)
  const afterStr = after === null || after === undefined ? '—' : String(after)

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 p-3 text-sm">
      <div className="flex-1">
        <p className="font-medium">{field}</p>
      </div>
      <div className="flex gap-4 items-center flex-1 justify-end">
        <div className="font-mono text-xs p-2 rounded bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 max-w-32 truncate">
          {beforeStr}
        </div>
        <span className="text-muted-foreground">→</span>
        <div className="font-mono text-xs p-2 rounded bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 max-w-32 truncate">
          {afterStr}
        </div>
      </div>
    </div>
  )
}

export function ImportDiffViewer({ result }: ImportDiffViewerProps) {
  const changedFields = Object.entries(result.updatedFields).filter(
    ([, change]) => change.changed
  )

  if (changedFields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Before / After Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No fields were changed in this import.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Before / After Comparison ({changedFields.length} changed)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {changedFields.map(([field, change]) => (
          <DiffRow
            key={field}
            field={field}
            before={change.before}
            after={change.after}
          />
        ))}
      </CardContent>
    </Card>
  )
}
