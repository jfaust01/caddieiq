'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Search, X } from 'lucide-react'
import { useState, useCallback, useEffect, useMemo } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { CourseSummary } from '@/features/courses/types'

interface CourseSelectorProps {
  currentCourseId: string
  currentCourseName: string
  courses: CourseSummary[]
}

/**
 * Course selector dropdown for the course detail header.
 *
 * Features:
 * - Large, clickable course name as trigger
 * - Search when >10 items
 * - Keyboard navigation
 * - Current course highlighted
 * - Loading state on course change via useTransition
 */
export function CourseSelector({ currentCourseId, currentCourseName, courses }: CourseSelectorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const inputRef = useCallback((node: HTMLInputElement | null) => {
    if (node && open) {
      setTimeout(() => node.focus(), 0)
    }
  }, [open])

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses

    const query = searchQuery.toLowerCase()
    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(query) ||
        course.city?.toLowerCase().includes(query) ||
        course.stateProvince?.toLowerCase().includes(query) ||
        course.country?.toLowerCase().includes(query),
    )
  }, [courses, searchQuery])

  // Show search when more than 10 items
  const showSearch = courses.length > 10

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev + 1) % filteredCourses.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev - 1 + filteredCourses.length) % filteredCourses.length)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCourses[highlightedIndex]) {
            handleSelectCourse(filteredCourses[highlightedIndex].id)
          }
          break
        case 'Escape':
          e.preventDefault()
          setOpen(false)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, highlightedIndex, filteredCourses])

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [searchQuery])

  const handleSelectCourse = (courseId: string) => {
    if (courseId === currentCourseId || isPending) return

    setOpen(false)
    setSearchQuery('')

    startTransition(() => {
      router.push(`/courses/${courseId}`)
    })
  }

  const hasNoResults = showSearch && filteredCourses.length === 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={isPending}
        className={cn(
          'group inline-flex items-center gap-2 px-3 py-2',
          'text-2xl sm:text-3xl font-semibold tracking-tight',
          'rounded-lg border-2 border-transparent',
          'transition-colors duration-200',
          'hover:bg-muted/50 focus:outline-none focus-visible:border-primary',
          'cursor-pointer active:scale-95',
          isPending && 'opacity-75 pointer-events-none',
        )}
        title="Click to select course"
        type="button"
      >
        <span className="text-pretty break-words">{currentCourseName}</span>
        <ChevronDown
          size={24}
          className="flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </PopoverTrigger>

      <PopoverContent className="w-[420px] sm:w-full p-3" align="start">
        <div className="flex flex-col gap-3">
          {/* Search Input */}
          {showSearch ? (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isPending}
                className={cn(
                  'w-full pl-8 pr-3 py-2 text-sm',
                  'bg-muted/50 border border-border rounded-md',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-1 focus:ring-primary',
                  isPending && 'opacity-50 cursor-not-allowed',
                )}
              />
              {searchQuery && !isPending && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ) : null}

          {/* Course Options List */}
          {hasNoResults ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No courses found</div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredCourses.map((course, index) => {
                const isSelected = course.id === currentCourseId
                const isHighlighted = index === highlightedIndex

                return (
                  <button
                    key={course.id}
                    onClick={() => handleSelectCourse(course.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    disabled={isPending}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md transition-colors',
                      'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                      isSelected && 'bg-primary text-primary-foreground',
                      isHighlighted && !isSelected && 'bg-muted/60',
                      !isSelected && !isHighlighted && 'hover:bg-muted/40',
                      isPending && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {/* Course name */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="truncate font-medium text-sm">{course.name}</span>
                    </div>

                    {/* Location */}
                    {course.city || course.stateProvince || course.country ? (
                      <div className="text-xs text-muted-foreground/70 line-clamp-1">
                        {[course.city, course.stateProvince, course.country]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
