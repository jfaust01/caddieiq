'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface SearchResult {
  id: string
  type: 'player' | 'course' | 'tournament'
  name: string
  description?: string
  href: string
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (value: string) => {
    setQuery(value)

    if (value.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    try {
      setLoading(true)
      setIsOpen(true)
      const response = await fetch(`/api/analytics/search?q=${encodeURIComponent(value)}`)
      const data = await response.json()
      setResults(data.data || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'player':
        return '👤'
      case 'course':
        return '⛳'
      case 'tournament':
        return '🏆'
      default:
        return '🔍'
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search players, courses, tournaments..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length > 1 && setIsOpen(true)}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full shadow-lg z-50">
          <div className="max-h-96 overflow-y-auto">
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={result.href}
                onClick={() => setIsOpen(false)}
              >
                <div className="px-4 py-3 hover:bg-muted/50 border-b border-border/50 last:border-b-0 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getResultIcon(result.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{result.name}</p>
                      {result.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-muted px-2 py-1 rounded flex-shrink-0">
                      {result.type}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {isOpen && query.length > 1 && results.length === 0 && !loading && (
        <Card className="absolute top-full mt-2 w-full shadow-lg z-50 p-4 text-center text-muted-foreground">
          No results found for "{query}"
        </Card>
      )}
    </div>
  )
}
