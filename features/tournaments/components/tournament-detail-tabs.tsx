'use client'

import type { ReactNode } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TournamentDetailTabsProps {
  /** Live Overview panel content, rendered on the server and passed in. */
  overview: ReactNode
  /** Live Field panel content, rendered on the server and passed in. */
  field: ReactNode
  /** Field size, shown as a badge on the Field tab; 0 disables the tab. */
  fieldCount: number
}

/** Tabs still awaiting their data source. */
const RESERVED_TABS = [
  { value: 'course', label: 'Course' },
  { value: 'weather', label: 'Weather' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'draftkings', label: 'DraftKings' },
  { value: 'betting', label: 'Betting' },
  { value: 'history', label: 'History' },
] as const

/**
 * Segmented quick-navigation for the tournament research hub. Overview and
 * Field are fully functional (Field is enabled once a field is imported); the
 * remaining destinations exist as disabled tabs so the information architecture
 * is visible and stable before their data lands.
 */
export function TournamentDetailTabs({ overview, field, fieldCount }: TournamentDetailTabsProps) {
  const hasField = fieldCount > 0
  return (
    <Tabs defaultValue="overview" className="gap-4">
      <div className="overflow-x-auto">
        <TabsList variant="line" className="h-9 gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="field" disabled={!hasField}>
            Field
            {hasField ? (
              <span className="ml-1.5 rounded bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                {fieldCount}
              </span>
            ) : null}
          </TabsTrigger>
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

      <TabsContent value="field" className="flex flex-col gap-4">
        {field}
      </TabsContent>
    </Tabs>
  )
}
