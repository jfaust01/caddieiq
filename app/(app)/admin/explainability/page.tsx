import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { ExplainabilityDebugView } from '@/features/admin/explainability/explainability-debug-view'
import {
  loadPlayerOptions,
  loadTournamentOptions,
} from '@/features/admin/explainability/entity-options'
import {
  debugModelOptions,
  MODEL_ENTITY_KIND,
  resolveDebugExplanation,
} from '@/lib/explainability/debug-resolver'
import { MODELS } from '@/lib/explainability/registry'
import type { ModelId } from '@/lib/explainability/types'
import { getSession, isCurrentUserAdmin } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Explainability Debug',
  description: 'Internal diagnostics: inspect the canonical Explanation any model produces.',
}

// Resolved live per request against real services; never cache.
export const dynamic = 'force-dynamic'

const DEFAULT_MODEL: ModelId = 'overall-rating'

function isModelId(value: string | undefined): value is ModelId {
  return !!value && MODELS.some((m) => m.id === value)
}

interface PageProps {
  searchParams: Promise<{ model?: string; entityId?: string }>
}

export default async function ExplainabilityDebugPage({ searchParams }: PageProps) {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  // ADMIN-only. Non-admins get a 404 (not a 403) so the route's existence is
  // not disclosed; it is intentionally absent from navigation. The role is
  // re-read from the database inside the helper, never trusted from the client.
  if (!(await isCurrentUserAdmin())) notFound()

  const { model, entityId } = await searchParams
  const selectedModelId: ModelId = isModelId(model) ? model : DEFAULT_MODEL
  const selectedEntityId = entityId?.trim() || null

  const [playerOptions, tournamentOptions] = await Promise.all([
    loadPlayerOptions(),
    loadTournamentOptions(),
  ])

  // Resolve the entity label for the subject from whichever list it belongs to.
  const entityKind = MODEL_ENTITY_KIND[selectedModelId]
  const options = entityKind === 'player' ? playerOptions : tournamentOptions
  const entityLabel = selectedEntityId
    ? (options.find((o) => o.id === selectedEntityId)?.label ?? selectedEntityId)
    : null

  const resolution =
    selectedEntityId && entityLabel
      ? await resolveDebugExplanation(selectedModelId, selectedEntityId, entityLabel)
      : null

  return (
    <ExplainabilityDebugView
      models={debugModelOptions()}
      playerOptions={playerOptions}
      tournamentOptions={tournamentOptions}
      selectedModelId={selectedModelId}
      selectedEntityId={selectedEntityId}
      explanation={resolution?.status === 'resolved' ? resolution.explanation : null}
      unavailableReason={resolution?.status === 'unavailable' ? resolution.reason : null}
    />
  )
}
