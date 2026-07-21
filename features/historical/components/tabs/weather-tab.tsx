import { format } from 'date-fns'
import { Cloud, Wind, Droplets, Eye } from 'lucide-react'

interface WeatherTabProps {
  tournament: any
}

export function WeatherTab({ tournament }: WeatherTabProps) {
  const weatherSnapshots = tournament.weatherSnapshots || []

  if (weatherSnapshots.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No weather data available for this tournament
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {weatherSnapshots.map((weather: any, idx: number) => (
          <div key={idx} className="p-4 border border-border rounded-lg space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(weather.recordedAt), 'MMM d, h:mm a')}
              </p>
              <p className="text-lg font-semibold capitalize">{weather.condition}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-muted-foreground" />
                <span>{weather.windSpeed} mph wind</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-muted-foreground" />
                <span>{weather.temperature}°F</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-muted-foreground" />
                <span>{weather.humidity}% humidity</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span>{weather.cloudCover}% cloud</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
