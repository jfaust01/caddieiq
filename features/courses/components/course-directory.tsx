'use client'

import { TriangleAlert } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { CourseCard } from '@/features/courses/components/course-card'
import { CoursePagination } from '@/features/courses/components/course-pagination'
import { CourseSearch } from '@/features/courses/components/course-search'
import { CourseSkeleton } from '@/features/courses/components/course-skeleton'
import { COURSES_PAGE_SIZE, useCourses } from '@/features/courses/hooks/use-courses'

function ResultSummary({
  page,
  pageSize,
  total,
  isLoading,
}: {
  page: number
  pageSize: number
  total: number
  isLoading: boolean
}) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading courses…</p>
  }
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No courses found</p>
  }
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      Showing <span className="font-medium text-foreground">{start}</span>–
      <span className="font-medium text-foreground">{end}</span> of{' '}
      <span className="font-medium text-foreground">{total}</span> courses
    </p>
  )
}

/**
 * The searchable, filterable course directory. Owns directory UI state via the
 * `useCourses` hook and renders grid, loading, empty, and error states against
 * the live course data.
 */
export function CourseDirectory() {
  const { filters, setSearch, resetFilters, hasActiveFilters, page, setPage, result, isLoading, isError } = useCourses()

  const showEmpty = !isLoading && !isError && result.items.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <CourseSearch defaultValue={filters.search} onSearch={setSearch} className="sm:max-w-sm" />
      </div>

      <ResultSummary
        page={result.page}
        pageSize={COURSES_PAGE_SIZE}
        total={result.total}
        isLoading={isLoading}
      />

      {isError ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load courses"
          description="We couldn't reach the database. Please try again in a moment."
        />
      ) : isLoading ? (
        <CourseSkeleton count={COURSES_PAGE_SIZE} />
      ) : showEmpty ? (
        <EmptyState
          icon={TriangleAlert}
          title={hasActiveFilters ? 'No courses found' : 'No courses'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search filters.'
              : 'No courses are available yet. Check back soon.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.items.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {!isLoading && !isError && !showEmpty ? (
        <CoursePagination
          page={result.page}
          totalPages={result.totalPages}
          onPageChange={setPage}
          className="pt-2"
        />
      ) : null}
    </div>
  )
}
