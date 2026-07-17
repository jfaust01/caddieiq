'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { GolfcourseSearch } from './golfcourse-search'
import { CourseDatabaseSnapshot } from './course-database-snapshot'
import { ImportControls } from './import-controls'
import { ImportProgress } from './import-progress'
import { ImportSummary } from './import-summary'
import { ImportDiffViewer } from './import-diff-viewer'
import { RawApiResponseDialog } from './raw-api-response-dialog'
import { DataCoverageDashboard } from './data-coverage-dashboard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { CourseSearchResult, GolfCourseImportResult, DataCoverageCategory } from '@/lib/admin/golfcourse-import-types'
import type { CourseDetails } from '@/lib/generated/prisma/client'

export function GolfCourseAdminImportClient() {
  const [selectedCourse, setSelectedCourse] = useState<CourseSearchResult | null>(null)
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<GolfCourseImportResult | null>(null)
  const [isRawResponseOpen, setIsRawResponseOpen] = useState(false)
  const [coverage, setCoverage] = useState<DataCoverageCategory[]>([])
  const [isLoadingCoverage, setIsLoadingCoverage] = useState(false)

  // Fetch full course details and coverage when a course is selected
  useEffect(() => {
    if (!selectedCourse?.id) return

    const fetchCourseData = async () => {
      try {
        setIsLoadingCoverage(true)

        // Fetch full course details
        const detailsResponse = await fetch(
          `/api/admin/imports/golfcourse/course/${selectedCourse.id}`
        )
        if (!detailsResponse.ok) throw new Error('Failed to fetch course details')
        const details = (await detailsResponse.json()) as CourseDetails
        setCourseDetails(details)

        // Fetch data coverage
        const coverageResponse = await fetch(
          `/api/admin/imports/golfcourse/coverage/${selectedCourse.id}`
        )
        if (!coverageResponse.ok) throw new Error('Failed to fetch coverage')
        const coverageData = (await coverageResponse.json()) as DataCoverageCategory[]
        setCoverage(coverageData)

        setImportResult(null)
      } catch (error) {
        console.error('[v0] Failed to load course data:', error)
      } finally {
        setIsLoadingCoverage(false)
      }
    }

    fetchCourseData()
  }, [selectedCourse?.id, toast])

  const handleImport = async (forceRefresh: boolean) => {
    if (!selectedCourse?.id) return

    try {
      setIsImporting(true)

      const response = await fetch('/api/admin/imports/golfcourse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          forceRefresh,
        }),
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result = (await response.json()) as GolfCourseImportResult
      setImportResult(result)

      if (result.success) {
        console.log('[v0] Import successful:', result)

        // Refresh course details
        const detailsResponse = await fetch(
          `/api/admin/imports/golfcourse/course/${selectedCourse.id}`
        )
        if (detailsResponse.ok) {
          const details = (await detailsResponse.json()) as CourseDetails
          setCourseDetails(details)
        }

        // Refresh coverage
        const coverageResponse = await fetch(
          `/api/admin/imports/golfcourse/coverage/${selectedCourse.id}`
        )
        if (coverageResponse.ok) {
          const coverageData = (await coverageResponse.json()) as DataCoverageCategory[]
          setCoverage(coverageData)
        }
      } else {
        console.error('[v0] Import failed:', result.errors)
      }
    } catch (error) {
      console.error('[v0] Import error:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const overallCoverage = coverage.length
    ? Math.round(coverage.reduce((sum, cat) => sum + cat.coverage, 0) / coverage.length)
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">GolfCourse API Admin Import</h1>
        <p className="text-muted-foreground">
          Search, re-import, and debug course data from GolfCourseAPI.
        </p>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Search Course</h2>
        <GolfcourseSearch onSelectCourse={setSelectedCourse} />
      </div>

      {!selectedCourse && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Search and select a course to begin. The search includes course name, city, and state.
          </AlertDescription>
        </Alert>
      )}

      {selectedCourse && courseDetails && (
        <>
          {/* Current Database Snapshot */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Current Database Snapshot</h2>
            <CourseDatabaseSnapshot course={courseDetails} />
          </div>

          {/* Import Controls */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Import Controls</h2>
            <ImportControls
              courseId={selectedCourse.id}
              isImporting={isImporting}
              onImport={handleImport}
              onViewRawResponse={() => setIsRawResponseOpen(true)}
            />
          </div>

          {/* Import Progress */}
          {isImporting && (
            <ImportProgress
              isImporting={isImporting}
              isComplete={false}
            />
          )}

          {/* Import Result */}
          {importResult && (
            <>
              <ImportProgress
                isImporting={false}
                isComplete={importResult.success}
                duration={importResult.duration}
              />

              <ImportSummary result={importResult} />

              {Object.keys(importResult.updatedFields).length > 0 && (
                <ImportDiffViewer result={importResult} />
              )}
            </>
          )}

          {/* Data Coverage Dashboard */}
          {coverage.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Data Coverage Dashboard</h2>
              <DataCoverageDashboard
                categories={coverage}
                overallCoverage={overallCoverage}
              />
            </div>
          )}

          {/* Raw API Response Dialog */}
          {importResult && (
            <RawApiResponseDialog
              isOpen={isRawResponseOpen}
              onOpenChange={setIsRawResponseOpen}
              response={importResult.rawResponse}
              courseName={courseDetails.courseName || 'unknown'}
            />
          )}
        </>
      )}
    </div>
  )
}
