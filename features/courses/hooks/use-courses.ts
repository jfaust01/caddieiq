'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import type { PaginatedResult } from '@/features/tournaments/types'
import type { CourseSummary } from '@/features/courses/types'
import { fetchCourses } from '@/features/courses/services/course-actions'

export const COURSES_PAGE_SIZE = 9

export const DEFAULT_COURSE_FILTERS = {
  search: '',
}

const EMPTY_RESULT: PaginatedResult<CourseSummary> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: COURSES_PAGE_SIZE,
  totalPages: 1,
}

export interface UseCoursesResult {
  filters: { search: string }
  setSearch: (value: string) => void
  resetFilters: () => void
  hasActiveFilters: boolean
  page: number
  setPage: (page: number) => void
  result: PaginatedResult<CourseSummary>
  isLoading: boolean
  isError: boolean
}

/**
 * Client controller for the course directory: search and pagination over the
 * *live* course data.
 *
 * Data is fetched through the `fetchCourses` server action via TanStack Query
 * (no fetching in effects). Previous pages are kept in place while the next
 * query resolves so pagination stays smooth, and query errors are surfaced so
 * the directory can render a database-error state.
 */
export function useCourses(): UseCoursesResult {
  const [filters, setFilters] = useState(DEFAULT_COURSE_FILTERS)
  const [page, setPage] = useState(1)

  const query = useMemo(
    () => ({ search: filters.search, page, pageSize: COURSES_PAGE_SIZE }),
    [filters, page],
  )

  const coursesQuery = useQuery({
    queryKey: ['courses', query],
    queryFn: async () => {
      const response = await fetchCourses(query)
      if (!response.ok) throw new Error(response.error)
      return response.data
    },
    placeholderData: keepPreviousData,
  })

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
    setPage(1)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_COURSE_FILTERS)
    setPage(1)
  }, [])

  const hasActiveFilters = useMemo(
    () => filters.search.trim() !== '',
    [filters],
  )

  return {
    filters,
    setSearch,
    resetFilters,
    hasActiveFilters,
    page,
    setPage,
    result: coursesQuery.data ?? EMPTY_RESULT,
    isLoading: coursesQuery.isPending,
    isError: coursesQuery.isError,
  }
}
