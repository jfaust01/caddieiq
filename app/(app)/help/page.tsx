import type { Metadata } from 'next'

import { HelpView } from '@/features/help/help-view'

export const metadata: Metadata = {
  title: 'Help',
  description: 'Guides, documentation, and support for CaddieIQ.',
}

export default function HelpPage() {
  return <HelpView />
}
