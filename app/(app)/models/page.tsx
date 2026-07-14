import type { Metadata } from 'next'

import { ModelsView } from '@/features/models/models-view'

export const metadata: Metadata = {
  title: 'Models',
  description: 'Design, tune, and deploy custom prediction models.',
}

export default function ModelsPage() {
  return <ModelsView />
}
