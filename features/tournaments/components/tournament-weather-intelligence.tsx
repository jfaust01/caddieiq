import {
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  Gauge,
  Info,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'
import { cn } from '@/lib/utils'
import type {
  GolfWeatherCharacteristics,
  Playability,
  RainSeverity,
  RoundLabel,
  WaveAdvantage,
  WeatherConfidence,
  WeatherDay,
  WeatherIntelligence,
  WeatherPeriodSignals,
  WindSeverity,
} from '@/lib/weather-intelligence'

const EM_DASH = '\u2014'

/** Confidence → badge treatment + label. */
const CONFIDENCE: Record<WeatherConfidence, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  high: { label: 'Verified', variant: 'default' },
  medium: { label: 'Partial', variant: 'secondary' },
  low: { label: 'Low confidence', variant: 'outline' },
  unavailable: { label: 'Unavailable', variant: 'outline' },
}

/** Human labels for tournament-day roles. */
const ROUND_LABEL: Record<RoundLabel, string> = {
  practice: 'Practice',
  'round-1': 'Round 1',
  'round-2': 'Round 2',
  'round-3': 'Round 3',
  'round-4': 'Round 4',
}

const WIND_LABEL: Record<WindSeverity, string> = {
  calm: 'Calm',
  moderate: 'Moderate',
  strong: 'Strong',
  extreme: 'Extreme',
}

const RAIN_LABEL: Record<RainSeverity, string> = {
  none: 'Dry',
  light: 'Light',
  moderate: 'Moderate',
  heavy: 'Heavy',
}

const PLAYABILITY_LABEL: Record<Playability, string> = {
  excellent: 'Excellent',
  good: 'Good',
  marginal: 'Marginal',
  poor: 'Poor',
}

const WAVE_LABEL: Record<WaveAdvantage, string> = {
  morning: 'Morning wave favored',
  afternoon: 'Afternoon wave favored',
  neutral: 'No wave edge',
  unknown: 'Wave edge unknown',
}

/** A rounded value with a unit, or an em-dash when null. */
function num(value: number | null, unit = ''): string {
  return value === null ? EM_DASH : `${Math.round(value)}${unit}`
}

/** Format a `YYYY-MM-DD` local date as a short weekday + day. */
function formatDay(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/** Format a local hour (0..23) as "7a" / "2p". */
function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  const suffix = h < 12 ? 'a' : 'p'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display}${suffix}`
}

/**
 * A compact vertical bar for one timeline period. Height encodes the value
 * against a fixed max; muted when the value is missing so gaps read as
 * "no data" rather than zero.
 */
function TimelineBar({
  value,
  max,
  label,
  tone,
}: {
  value: number | null
  max: number
  label: string
  tone: 'wind' | 'rain'
}) {
  const pct = value === null ? 0 : Math.max(6, Math.min(100, (value / max) * 100))
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1" title={label}>
      <div className="flex h-16 w-full items-end justify-center">
        <span
          className={cn(
            'w-2 rounded-full',
            value === null
              ? 'bg-border'
              : tone === 'wind'
                ? 'bg-primary'
                : 'bg-sky-500 dark:bg-sky-400',
          )}
          style={{ height: `${value === null ? 6 : pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  )
}

/** A wind or rain timeline over the next set of periods. */
function Timeline({
  periods,
  tone,
}: {
  periods: readonly WeatherPeriodSignals[]
  tone: 'wind' | 'rain'
}) {
  const isWind = tone === 'wind'
  const max = isWind ? 40 : 100
  return (
    <section className="flex flex-col gap-2">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {isWind ? <Wind className="size-3.5 text-primary" aria-hidden /> : <CloudRain className="size-3.5 text-sky-500" aria-hidden />}
        {isWind ? 'Wind (mph)' : 'Rain chance (%)'}
      </h4>
      <div className="flex items-end gap-1">
        {periods.map((p) => {
          const value = isWind ? p.windSpeedMph : p.rainProbability === null ? null : p.rainProbability * 100
          const readable = isWind ? num(p.windSpeedMph, ' mph') : `${num(value)}%`
          return (
            <TimelineBar
              key={p.time}
              value={value}
              max={max}
              tone={tone}
              label={`${formatHour(p.localHour)}: ${readable}`}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-1">
        {periods.map((p, i) => (
          <span
            key={p.time}
            className="min-w-0 flex-1 text-center text-[10px] text-muted-foreground/70 tabular-nums"
          >
            {i % 2 === 0 ? formatHour(p.localHour) : ''}
          </span>
        ))}
      </div>
    </section>
  )
}

/** A single current-conditions metric tile. */
function CurrentStat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Wind
  label: string
  value: string
  sub?: string | null
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-semibold tabular-nums">{value}</span>
        {sub ? <span className="truncate text-xs text-muted-foreground">{sub}</span> : null}
      </div>
    </div>
  )
}

/** A labeled characteristic chip (wind / rain / playability). */
function Characteristic({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {value ? (
        <span className="text-sm font-medium">{value}</span>
      ) : (
        <span className="text-sm italic text-muted-foreground/70">{EM_DASH}</span>
      )}
    </div>
  )
}

/** Summarize a day's golf characteristics into display labels. */
function dayCharacteristics(c: GolfWeatherCharacteristics) {
  return {
    wind: c.windSeverity ? WIND_LABEL[c.windSeverity] : null,
    rain: c.rainSeverity ? RAIN_LABEL[c.rainSeverity] : null,
    playability: c.playability ? PLAYABILITY_LABEL[c.playability] : null,
  }
}

/** One tournament-day forecast row. */
function DayRow({ day }: { day: WeatherDay }) {
  const chars = dayCharacteristics(day.characteristics)
  const wave = day.waves.advantage
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">
            {day.round ? ROUND_LABEL[day.round] : formatDay(day.date)}
          </span>
          {day.round ? (
            <span className="truncate text-xs text-muted-foreground">{formatDay(day.date)}</span>
          ) : null}
        </div>
        <span className="text-sm font-semibold tabular-nums">
          {num(day.tempHighF, '\u00b0')} <span className="text-muted-foreground">/ {num(day.tempLowF, '\u00b0')}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {chars.wind ? (
          <Badge variant="outline" className="gap-1">
            <Wind className="size-3" aria-hidden />
            {chars.wind}
          </Badge>
        ) : null}
        {chars.rain ? (
          <Badge variant="outline" className="gap-1">
            <Droplets className="size-3" aria-hidden />
            {chars.rain}
          </Badge>
        ) : null}
        {chars.playability ? (
          <Badge variant="secondary" className="gap-1">
            <CloudSun className="size-3" aria-hidden />
            {PLAYABILITY_LABEL[day.characteristics.playability!]}
          </Badge>
        ) : null}
        {wave === 'morning' || wave === 'afternoon' ? (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            {wave === 'morning' ? <Sunrise className="size-3" aria-hidden /> : <Sunset className="size-3" aria-hidden />}
            {wave === 'morning' ? 'AM edge' : 'PM edge'}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}

interface TournamentWeatherIntelligenceProps {
  weather: WeatherIntelligence
}

/**
 * Weather Intelligence on the Tournament hub. Surfaces the shared Weather Signal
 * Family — current conditions, a per-round forecast, wind/rain timelines, and
 * the morning/afternoon wave edge — with its own confidence grade.
 *
 * Honest by construction: when no forecast has been imported (no API key, no
 * linked venue, or nothing fetched yet) it renders a neutral placeholder naming
 * the venue and the reason, never a fabricated forecast. Missing individual
 * signals read as em-dashes rather than zeros.
 */
export function TournamentWeatherIntelligence({ weather }: TournamentWeatherIntelligenceProps) {
  const confidence = CONFIDENCE[weather.confidence]
  const venueName = weather.venue?.courseName ?? null

  const description = venueName
    ? `Forecast conditions for ${venueName} — the shared weather signals that feed course fit, DFS and betting models.`
    : 'Forecast conditions for the host venue — the shared weather signals that feed course fit, DFS and betting models.'

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        as="h3"
        title="Weather intelligence"
        description={description}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CloudSun className="size-4 text-primary" aria-hidden />
            Conditions
          </CardTitle>
          <Badge variant={confidence.variant}>{confidence.label}</Badge>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {weather.status === 'unavailable' ? (
            <p className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-surface/50 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span className="text-pretty">
                {weather.detail ??
                  'The Weather Intelligence Engine is live for this event. No forecast has been imported yet, so conditions read as pending. This fills in automatically as forecast data arrives — nothing here is estimated.'}
              </span>
            </p>
          ) : (
            <WeatherBody weather={weather} />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

/** The available-forecast body: current, timelines, per-round, wave edge. */
function WeatherBody({ weather }: { weather: WeatherIntelligence }) {
  const { current, overall, days, timeline, waveAdvantage, provenance } = weather
  // Show a rolling window of upcoming periods for the timelines.
  const window = timeline.slice(0, 12)

  return (
    <>
      {current ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <CurrentStat
            icon={Thermometer}
            label="Temperature"
            value={num(current.temperatureF, '\u00b0F')}
            sub={current.feelsLikeF === null ? null : `Feels ${num(current.feelsLikeF, '\u00b0')}`}
          />
          <CurrentStat
            icon={Wind}
            label="Wind"
            value={num(current.windSpeedMph, ' mph')}
            sub={
              current.windCardinal
                ? `${current.windCardinal}${current.windGustMph === null ? '' : ` · gust ${num(current.windGustMph)}`}`
                : current.windGustMph === null
                  ? null
                  : `Gust ${num(current.windGustMph)} mph`
            }
          />
          <CurrentStat
            icon={Droplets}
            label="Rain chance"
            value={current.rainProbability === null ? EM_DASH : `${Math.round(current.rainProbability * 100)}%`}
            sub={current.condition}
          />
          <CurrentStat
            icon={Gauge}
            label="Humidity"
            value={num(current.humidity, '%')}
            sub={current.cloudCover === null ? null : `${num(current.cloudCover)}% cloud`}
          />
        </div>
      ) : null}

      {window.length > 1 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <Timeline periods={window} tone="wind" />
          <Timeline periods={window} tone="rain" />
        </div>
      ) : null}

      {days.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <CloudSun className="size-3.5 text-primary" aria-hidden />
            Round-by-round
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {days.map((day) => (
              <DayRow key={day.date} day={day} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        {overall ? (
          <section className="flex flex-col">
            <h4 className="flex items-center gap-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Compass className="size-3.5 text-primary" aria-hidden />
              Window summary
            </h4>
            <div className="flex flex-col divide-y divide-border">
              <Characteristic label="Wind" value={overall.windSeverity ? WIND_LABEL[overall.windSeverity] : null} />
              <Characteristic label="Rain" value={overall.rainSeverity ? RAIN_LABEL[overall.rainSeverity] : null} />
              <Characteristic
                label="Playability"
                value={overall.playability ? PLAYABILITY_LABEL[overall.playability] : null}
              />
              <Characteristic label="Avg wind" value={overall.avgWindMph === null ? null : `${num(overall.avgWindMph)} mph`} />
              <Characteristic label="Max gust" value={overall.maxGustMph === null ? null : `${num(overall.maxGustMph)} mph`} />
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-2">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sunrise className="size-3.5 text-primary" aria-hidden />
            Tee-time edge
          </h4>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface/40 p-3">
            {waveAdvantage === 'afternoon' ? (
              <Sunset className="size-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <Sunrise className="size-4 shrink-0 text-primary" aria-hidden />
            )}
            <span className="text-sm font-medium text-pretty">{WAVE_LABEL[waveAdvantage]}</span>
          </div>
          <p className="text-xs text-muted-foreground text-pretty">
            {waveAdvantage === 'morning' || waveAdvantage === 'afternoon'
              ? 'Derived from the wind and rain gap between morning and afternoon tee times on the next covered round.'
              : 'The morning and afternoon waves face comparable conditions, or the split cannot be resolved from the current forecast.'}
          </p>
        </section>
      </div>

      {provenance ? (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="text-pretty">
            {`Forecast from ${provenance.source}, captured ${provenance.forecastAgeHours}h ago · ${provenance.roundsCovered} of ${provenance.roundsTotal} rounds covered. Missing values are shown as ${EM_DASH} rather than estimated.`}
          </span>
        </p>
      ) : null}
    </>
  )
}
