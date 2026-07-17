'use client'

import { useState } from 'react'
import { RefreshCw, FileJson } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ImportControlsProps {
  courseId: string
  isImporting: boolean
  onImport: (forceRefresh: boolean) => Promise<void>
  onViewRawResponse: () => void
}

export function ImportControls({
  courseId,
  isImporting,
  onImport,
  onViewRawResponse,
}: ImportControlsProps) {
  const [forceRefresh, setForceRefresh] = useState(false)

  const handleImport = async () => {
    await onImport(forceRefresh)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Import Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            id="force-refresh"
            type="checkbox"
            checked={forceRefresh}
            onChange={(e) => setForceRefresh(e.target.checked)}
            disabled={isImporting}
            className="size-4 cursor-pointer"
          />
          <label
            htmlFor="force-refresh"
            className="cursor-pointer text-sm font-normal"
          >
            Force Refresh
          </label>
          <p className="text-xs text-muted-foreground ml-auto">
            {forceRefresh
              ? 'Always request fresh data from GolfCourseAPI'
              : 'Skip provider cache when appropriate'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="flex-1"
            size="sm"
          >
            {isImporting ? (
              <>
                <RefreshCw className="size-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <RefreshCw className="size-4 mr-2" />
                Re-import Course
              </>
            )}
          </Button>

          <Button
            onClick={onViewRawResponse}
            disabled={isImporting}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <FileJson className="size-4" />
            View Raw API Response
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
