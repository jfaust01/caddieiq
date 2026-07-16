'use client'

import { SearchBar } from '@/components/shared/search-bar'

export interface CourseSearchProps {
  defaultValue?: string
  onSearch: (value: string) => void
  className?: string
}

export function CourseSearch({ defaultValue = '', onSearch, className }: CourseSearchProps) {
  return (
    <SearchBar
      placeholder="Search courses by name, city, or location…"
      defaultValue={defaultValue}
      onSearch={onSearch}
      className={className}
    />
  )
}
