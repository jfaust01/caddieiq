import { Compass, Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  CourseBand,
  CourseCharacteristic,
  CourseProfile,
  CourseProfileGroup,
  CourseSignal,
} from '@/lib/domain/course'

/** Display order + labels for the profile's logical groups. */
const GROUP_ORDER: readonly { key: CourseProfileGroup; label: string }[] = [
  { key: 'identity', label: 'Identity' },
  { key: 'surfaces', label: 'Surfaces' },
  { key: 'setup', label: 'Setup & conditions' },
  { key: 'demands', label: 'Skill demands' },
  { key: 'scoring', label: 'Scoring profile' },
]

/** Which of the three band segments are lit, per band. */
const BAND_FILL: Record<CourseBand, number> = { low: 1, medium: 2, high: 3 }

/**
 * A three-segment meter for a normalized rating band. Purely presentational —
 * it reflects the verified band the engine derived, nothing more.
 */
function BandMeter({ band }: { band: CourseBand }) {
  const filled = BAND_FILL[band]
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {[1, 2, 3].map((segment) => (
        <span
          key={segment}
          className={cn(
            'h-1.5 w-5 rounded-full transition-colors',
            segment <= filled ? 'bg-primary' : 'bg-border',
          )}
        />
      ))}
    </span>
  )
}

/** Render the right-hand value cell for a single characteristic's signal. */
function SignalValue({ signal }: { signal: CourseSignal }) {
  if (signal.status === 'unknown') {
    return (
      <span className="text-sm text-muted-foreground/70 italic">Not yet available</span>
    )
  }
  if (signal.kind === 'rating') {
    return (
      <span className="flex items-center gap-2">
        <BandMeter band={signal.band} />
        <span className="text-sm font-medium tabular-nums">{signal.display}</span>
      </span>
    )
  }
  if (signal.kind === 'category') {
    return <Badge variant="secondary">{signal.display}</Badge>
  }
  // measure
  return <span className="text-sm font-medium tabular-nums">{signal.display}</span>
}

/** One label/value row for a characteristic. */
function CharacteristicRow({ characteristic }: { characteristic: CourseCharacteristic }) {
  const { meta, signal } = characteristic
  const verified = signal.status === 'verified'
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            'truncate text-sm',
            verified ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {meta.label}
        </span>
        {verified && meta.interpretation ? (
          <span className="truncate text-xs text-muted-foreground">
            {meta.interpretation}
          </span>
        ) : null}
      </div>
      <SignalValue signal={signal} />
    </div>
  )
}

interface CourseIntelligencePanelProps {
  profile: CourseProfile
}

/**
 * Course Intelligence card. Renders the normalized {@link CourseProfile} the
 * engine derives from verified course facts, grouped for scanning. Every
 * modeled characteristic is shown; unresolved ones read "Not yet available"
 * rather than a fabricated value, and a coverage badge states exactly how many
 * of the modeled characteristics are backed by real data.
 */
export function CourseIntelligencePanel({ profile }: CourseIntelligencePanelProps) {
  const { coverage } = profile
  const hasAny = coverage.verified > 0

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="size-4 text-primary" aria-hidden />
          Course Intelligence
        </CardTitle>
        <Badge variant={hasAny ? 'default' : 'outline'}>
          {coverage.verified} / {coverage.total} verified
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {!hasAny ? (
          <p className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-surface/50 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="text-pretty">
              {
                'The Course Intelligence Engine is live for this venue. No verified course characteristics have been imported yet, so every attribute below reads as pending. Each one fills in automatically as data arrives — nothing here is estimated.'
              }
            </span>
          </p>
        ) : null}

        <div className="flex flex-col gap-6">
          {GROUP_ORDER.map(({ key, label }) => {
            const rows = profile.characteristics.filter((c) => c.meta.group === key)
            if (rows.length === 0) return null
            return (
              <section key={key} className="flex flex-col gap-1">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {label}
                </h3>
                <div className="flex flex-col divide-y divide-border">
                  {rows.map((characteristic) => (
                    <CharacteristicRow
                      key={characteristic.meta.key}
                      characteristic={characteristic}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="text-pretty">
            {
              'Ratings are normalized to Low / Medium / High from verified source measurements. Attributes without verified data are shown as pending rather than estimated.'
            }
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
