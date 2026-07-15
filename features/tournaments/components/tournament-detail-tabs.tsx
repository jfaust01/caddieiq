'use client'

import type { ReactNode } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TournamentDetailTabsProps {
  /** Live Overview panel content, rendered on the server and passed in. */
  overview: ReactNode
}

/** Quick-navigation tabs. Only Overview is active today; the rest are reserved. */
const RESERVED_TABS = [
  { value: 'field', label: 'Field' },
  { value: 'course', label: 'Course' },
  { value: 'weather', label: 'Weather' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'draftkings', label: 'DraftKings' },
  { value: 'betting', label: 'Betting' },
  { value: 'history', label: 'History' },
] as const

/**
 * Segmented quick-navigation for the tournament research hub. Overview is fully
 * functional; the remaining destinations exist as disabled tabs so the
 * information architecture is visible and stable before their data lands.
 */
export function TournamentDetailTabs({ overview }: TournamentDetailTabsProps) {
  return (
    <Tabs defaultValue="overview" className="gap-4">
      <div className="overflow-x-auto">
        <TabsList variant="line" className="h-9 gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {RESERVED_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} disabled>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="overview" className="flex flex-col gap-4">
        {overview}
      </TabsContent>
    </Tabs>
  )
}
