import type { Metadata } from 'next'

import { SettingsView } from '@/features/settings/settings-view'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your workspace, preferences, and account.',
}

export default function SettingsPage() {
  return <SettingsView />
}
