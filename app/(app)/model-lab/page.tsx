import type { Metadata } from 'next'

import { ModelLabView } from '@/features/model-lab'

export const metadata: Metadata = {
  title: 'Model Lab',
  description:
    'Compose custom ranking models by weighting metric groups and preview the field in real time.',
}

export default function ModelLabPage() {
  return <ModelLabView />
}
