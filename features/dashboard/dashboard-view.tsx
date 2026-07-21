import { Activity, LineChart, SlidersHorizontal, Users } from 'lucide-react'
import Link from 'next/link'

import { StatCard } from '@/components/cards/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import { SectionHeader } from '@/components/shared/section-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountSummary } from '@/features/dashboard/account-summary'
import type { StatMetric } from '@/types'

const OVERVIEW_METRICS: StatMetric[] = [
  { id: 'models', label: 'Active models', value: '—', icon: SlidersHorizontal, hint: 'Deploy a model to begin tracking.' },
  { id: 'players', label: 'Tracked players', value: '—', icon: Users, hint: 'Add players to your universe.' },
  { id: 'accuracy', label: 'Model accuracy', value: '—', icon: LineChart, hint: 'Populated after your first backtest.' },
  { id: 'runs', label: 'Runs this week', value: '—', icon: Activity, hint: 'Model executions appear here.' },
]

interface DashboardViewProps {
  name: string
  email: string
  tier: string
  isAdmin: boolean
}

export function DashboardView({
  name,
  email,
  tier,
  isAdmin,
}: DashboardViewProps) {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${name}`}
        description="Your command center for models, picks, and performance. Connect data sources to bring this workspace to life."
        actions={
          <Button nativeButton={false} render={<Link href="/models">New model</Link>} />
        }
      />

      <AccountSummary
        name={name}
        email={email}
        tier={tier}
        isAdmin={isAdmin}
      />

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Overview metrics"
      >
        {OVERVIEW_METRICS.map((metric) => (
          <StatCard key={metric.id} {...metric} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={LineChart}
              title="No performance data yet"
              description="Once you run a model, accuracy and trend charts will render here automatically."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Activity}
              title="Nothing to show"
              description="Model runs, edits, and picks will stream into this feed."
            />
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Get started"
          description="A few steps to set up your analytics workspace."
        />
        <EmptyState
          icon={SlidersHorizontal}
          title="Build your first model"
          description="Define inputs, weights, and scoring logic to start generating picks."
          action={
            <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/models">Go to Models</Link>}
          />
          }
        />
      </section>
    </PageShell>
  )
}
