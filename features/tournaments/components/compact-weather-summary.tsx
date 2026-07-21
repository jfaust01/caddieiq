'use client'

import { Cloud, Wind, CloudRain, Eye } from 'lucide-react'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CompactWeatherSummaryProps {
  weather: WeatherIntelligence | null
}

/**
 * Compact weather card showing current conditions and forecast status.
 */
export function CompactWeatherSummary({ weather }: CompactWeatherSummaryProps) {
  if (!weather || weather.status !== 'available' || !weather.current) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {weather?.statusReport?.label ?? 'Weather data unavailable'}
        </CardContent>
      </Card>
    )
  }

  const current = weather.current
  const tempF = current.temperatureF ? Math.round(current.temperatureF) : null
  const windMph = current.windSpeedMph ? Math.round(current.windSpeedMph) : null
  const rainfallIn = current.rainfallInches ? current.rainfallInches.toFixed(2) : null
  const visibilityMi = current.visibilityMiles ? current.visibilityMiles.toFixed(1) : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Current Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {tempF !== null && (
            <div className="flex items-center gap-2">
              <Cloud className="size-4 text-blue-500 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Temperature</div>
                <div className="font-semibold">{tempF}°F</div>
              </div>
            </div>
          )}
          {windMph !== null && (
            <div className="flex items-center gap-2">
              <Wind className="size-4 text-cyan-500 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Wind</div>
                <div className="font-semibold">{windMph} mph</div>
              </div>
            </div>
          )}
          {rainfallIn !== null && (
            <div className="flex items-center gap-2">
              <CloudRain className="size-4 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Rainfall</div>
                <div className="font-semibold">{rainfallIn}"</div>
              </div>
            </div>
          )}
          {visibilityMi !== null && (
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-orange-500 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Visibility</div>
                <div className="font-semibold">{visibilityMi} mi</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
