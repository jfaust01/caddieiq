import type { Metadata } from 'next'

import { ModelLabView } from '@/features/model-lab'

export const metadata: Metadata = {
  title: 'Model Lab',
  description:
    'Compose custom ranking models by weighting metric groups and preview the field in real time.',
}

interface ModelLabDetailPageProps {
  params: Promise<{ modelId: string }>
}

/**
 * Deep-linkable model workspace. The `modelId` selects the initial model in the
 * lab; if it does not match a seeded model, the lab falls back to the first
 * available model.
 *
 * TODO(data): resolve the model server-side and 404 on unknown ids once models
 * are persisted per user.
 */
export default async function ModelLabDetailPage({
  params,
}: ModelLabDetailPageProps) {
  const { modelId } = await params
  return <ModelLabView initialModelId={modelId} />
}
