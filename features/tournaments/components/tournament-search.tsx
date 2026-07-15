'use client'

import { useEffect, useRef, useState } from 'react'

import { SearchBar } from '@/components/shared/search-bar'

interface TournamentSearchProps {
  defaultValue?: string
  onSearch: (value: string) => void
  /** Debounce delay in milliseconds. */
  delay?: number
  className?: string
}

/**
 * Debounced search input for the tournament directory. Wraps the shared
 * `SearchBar` so keystrokes do not thrash filtering while typing.
 */
export function TournamentSearch({
  defaultValue = '',
  onSearch,
  delay = 200,
  className,
}: TournamentSearchProps) {
  const [value, setValue] = useState(defaultValue)
  const onSearchRef = useRef(onSearch)

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    const timeout = setTimeout(() => onSearchRef.current(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return (
    <SearchBar
      placeholder="Search tournaments by name..."
      defaultValue={defaultValue}
      onSearch={setValue}
      className={className}
    />
  )
}
