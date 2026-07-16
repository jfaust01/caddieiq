import { Info } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import { SectionHeader } from '@/components/shared/section-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { ExplanationBreakdown } from '@/features/explainability/components/explanation-breakdown'
import { deterministicNarrator, type Explanation } from '@/lib/explainability'

import { DeveloperTrace } from './developer-trace'
import type { EntityOption } from './entity-options'
import { ExplainabilityPicker } from './explainability-picker'
import { JsonInspector } from './json-inspector'

interface ModelOption {
  id: string
  label: string
  methodology: string
  entityKind: 'player' | 'tournament'
}

interface ExplainabilityDebugViewProps {
  models: ModelOption[]
  playerOptions: EntityOption[]
  tournamentOptions: EntityOption[]
  selectedModelId: string
  selectedEntityId: string | null
  /** Resolved Explanation, or null when nothing has been resolved yet. */
  explanation: Explanation | null
  /** Populated when a resolution was attempted but produced no Explanation. */
  unavailableReason: string | null
}

/**
 * Admin-only debug surface. Shows the fully rendered canonical breakdown, the
 * deterministic narrative, and the raw Explanation JSON — the exact structure
 * every "Why?" surface consumes, so admins can audit model reasoning directly.
 */
export function ExplainabilityDebugView({
  models,
  playerOptions,
  tournamentOptions,
  selectedModelId,
  selectedEntityId,
  explanation,
  unavailableReason,
}: ExplainabilityDebugViewProps) {
  const narrative = explanation ? deterministicNarrator.narrate(explanation) : null

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin"
        title="Explainability debug"
        description="Inspect the canonical Explanation any model produces for a given entity — the same structured reasoning shown behind every “Why?” surface."
      />

      <ExplainabilityPicker
        models={models}
        playerOptions={playerOptions}
        tournamentOptions={tournamentOptions}
        selectedModelId={selectedModelId}
        selectedEntityId={selectedEntityId}
      />

      {unavailableReason ? (
        <Alert>
          <Info />
          <AlertTitle>No explanation resolved</AlertTitle>
          <AlertDescription>{unavailableReason}</AlertDescription>
        </Alert>
      ) : null}

      {explanation ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <SectionHeader title="Rendered breakdown" as="h2" />
            <Card>
              <CardContent className="pt-6">
                <ExplanationBreakdown explanation={explanation} />
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <SectionHeader
                title="Deterministic narrative"
                description="Prose composed strictly from the fields below — the LLM-ready narrator seam."
                as="h2"
              />
              <Card>
                <CardContent className="flex flex-col gap-3 pt-6 text-sm leading-relaxed">
                  <p className="text-pretty">{narrative?.summary}</p>
                  {narrative && narrative.bullets.length > 0 ? (
                    <ul className="flex flex-col gap-1.5">
                      {narrative.bullets.map((bullet, i) => (
                        <li key={i} className="flex gap-2 text-muted-foreground">
                          <span aria-hidden className="text-muted-foreground/60">
                            {'\u2022'}
                          </span>
                          <span className="text-pretty">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-3">
              <SectionHeader title="Raw Explanation JSON" as="h2" />
              <JsonInspector value={explanation} />
            </div>
          </div>
        </div>
      ) : null}

      {explanation ? (
        <div className="flex flex-col gap-3">
          <SectionHeader
            title="Developer Trace"
            description="The engineering view of the Decision Trace: every pipeline stage with its raw input, normalized value, weight, and signed contribution, plus the derived category, impact, confidence, and whether it influenced the outcome."
            as="h2"
          />
          <Card>
            <CardContent className="pt-6">
              <DeveloperTrace explanation={explanation} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  )
}
