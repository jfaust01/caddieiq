'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export interface ChartTheme {
  foreground: string
  mutedForeground: string
  border: string
  palette: string[]
}

const FALLBACK: ChartTheme = {
  foreground: '#111413',
  mutedForeground: '#71717a',
  border: 'rgba(0,0,0,0.1)',
  palette: ['#2f9e63', '#3b82f6', '#eab308', '#a855f7', '#ef4444'],
}

function readVar(name: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * Resolves the active design tokens into concrete color strings that the
 * charting library can render (ECharts cannot read CSS variables directly).
 */
export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme()
  const [theme, setTheme] = useState<ChartTheme>(FALLBACK)

  useEffect(() => {
    const palette = [
      readVar('--chart-1'),
      readVar('--chart-2'),
      readVar('--chart-3'),
      readVar('--chart-4'),
      readVar('--chart-5'),
    ].filter(Boolean)

    setTheme({
      foreground: readVar('--foreground') || FALLBACK.foreground,
      mutedForeground: readVar('--muted-foreground') || FALLBACK.mutedForeground,
      border: readVar('--border') || FALLBACK.border,
      palette: palette.length ? palette : FALLBACK.palette,
    })
  }, [resolvedTheme])

  return theme
}
