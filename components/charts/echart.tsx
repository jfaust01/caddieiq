'use client'

import type { EChartsOption } from 'echarts'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'

import { useChartTheme } from '@/hooks/use-chart-theme'
import { cn } from '@/lib/utils'

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
})

interface EChartProps {
  option: EChartsOption
  className?: string
  height?: number
}

/**
 * Theme-aware ECharts wrapper. Applies design-token colors to axes, grid, and
 * series palette so every chart matches the active theme automatically.
 */
export function EChart({ option, className, height = 320 }: EChartProps) {
  const theme = useChartTheme()

  const themedOption = useMemo<EChartsOption>(
    () => ({
      color: theme.palette,
      textStyle: { color: theme.mutedForeground },
      grid: { top: 24, right: 16, bottom: 32, left: 40, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      ...option,
    }),
    [option, theme],
  )

  return (
    <ReactECharts
      option={themedOption}
      className={cn('w-full', className)}
      style={{ height }}
      notMerge
      lazyUpdate
    />
  )
}
