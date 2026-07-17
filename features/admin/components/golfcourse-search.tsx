'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useCourseSearch } from '@/features/admin/hooks/use-course-search'
import type { CourseSearchResult } from '@/lib/admin/golfcourse-import-types'

interface GolfcourseSearchProps {
  onSelectCourse: (course: CourseSearchResult) => void
}

export function GolfcourseSearch({ onSelectCourse }: GolfcourseSearchProps) {
  const { query, setQuery, results, loading } = useCourseSearch()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search courses by name, city, or state..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-9"
        />
      </div>

      {isOpen && (results.length > 0 || loading || query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="p-1">
              {results.map((course) => (
                <button
                  key={course.id}
                  onClick={() => {
                    onSelectCourse(course)
                    setIsOpen(false)
                    setQuery('')
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent rounded"
                >
                  <div className="font-medium">{course.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {course.city}, {course.state}
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No courses found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
