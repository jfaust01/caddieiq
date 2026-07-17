'use client'

import { useState, useCallback, useEffect } from 'react'
import type { CourseSearchResult } from '@/lib/admin/golfcourse-import-types'

export function useCourseSearch(debounceMs: number = 300) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CourseSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/admin/imports/golfcourse/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery }),
        })

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = (await response.json()) as CourseSearchResult[]
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search error')
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs, search])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
  }
}
