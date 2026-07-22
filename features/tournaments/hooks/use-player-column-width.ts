'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Measures player name widths and calculates optimal PLAYER column width.
 * 
 * Measures visible player-name elements, finds the widest, and calculates
 * total width including headshot, gap, and padding. Recalculates on resize,
 * font load, or when entrants change.
 * 
 * Returns CSS variable (--player-column-width) clamped between 220px and 360px.
 */
export function usePlayerColumnWidth(
  entrants: Array<{ playerName: string }>,
  containerSelector: string = '.tournament-table-container'
) {
  const [columnWidth, setColumnWidth] = useState<string | null>(null)
  const measureTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  /**
   * Measure rendered player names and calculate column width
   */
  const measureWidth = useCallback(() => {
    // Clear any pending measure
    if (measureTimeoutRef.current) {
      clearTimeout(measureTimeoutRef.current)
    }

    // Schedule measurement after DOM is fully painted
    measureTimeoutRef.current = setTimeout(() => {
      try {
        // Find all player name elements in the DOM
        const playerNameElements = document.querySelectorAll('[data-player-name]')
        
        if (playerNameElements.length === 0) {
          // Fallback: no names rendered yet, use minimum width
          setColumnWidth('220px')
          return
        }

        // Measure all visible player names
        let maxNameWidth = 0
        playerNameElements.forEach((el) => {
          const rect = el.getBoundingClientRect()
          const width = rect.width
          if (width > maxNameWidth) {
            maxNameWidth = width
          }
        })

        // Constants
        const HEADSHOT_WIDTH = 44 // 11 * 4 = 44px (h-11 w-11 in Tailwind)
        const GAP_BETWEEN = 12 // gap-3 = 0.75rem = 12px
        const HORIZONTAL_PADDING = 24 // px-3 = 0.75rem * 2 = 24px total
        
        // Calculate total column width
        let totalWidth = HEADSHOT_WIDTH + GAP_BETWEEN + maxNameWidth + HORIZONTAL_PADDING
        
        // Clamp between min (220px) and max (360px)
        const MIN_WIDTH = 220
        const MAX_WIDTH = 360
        totalWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, totalWidth))

        setColumnWidth(`${totalWidth}px`)
      } catch (error) {
        console.error('[usePlayerColumnWidth] Measurement error:', error)
        setColumnWidth('220px')
      }
    }, 100) // 100ms delay for DOM to settle
  }, [])

  /**
   * Set up ResizeObserver to watch container and remeasure on resize
   */
  useEffect(() => {
    const container = document.querySelector(containerSelector)
    if (!container) return

    observerRef.current = new ResizeObserver(() => {
      measureWidth()
    })

    observerRef.current.observe(container)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [containerSelector, measureWidth])

  /**
   * Initial measurement and remeasure when entrants change
   */
  useEffect(() => {
    // Measure immediately on mount
    measureWidth()

    // Also measure after a small delay to catch font loading
    const fontLoadTimeout = setTimeout(measureWidth, 500)

    return () => clearTimeout(fontLoadTimeout)
  }, [entrants.length, measureWidth])

  /**
   * Listen for font load events and remeasure
   */
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return

    const handleFontLoad = () => {
      measureWidth()
    }

    document.fonts.addEventListener('loadingdone', handleFontLoad)
    return () => {
      document.fonts.removeEventListener('loadingdone', handleFontLoad)
    }
  }, [measureWidth])

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (measureTimeoutRef.current) {
        clearTimeout(measureTimeoutRef.current)
      }
    }
  }, [])

  return columnWidth
}
