import { BarChart3, LineChart, PieChart } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const PANELS = [
  {
    title: 'Trends',
    description: 'Track how model outputs move over time.',
    icon: LineChart,
    empty: 'Trend charts render here once data is available.',
  },
  {
    title: 'Distribution',
    description: 'Understand the spread of scores and ratings.',
    icon: BarChart3,
    empty: 'Distributions appear after your first model run.',
  },
  {
    title: 'Composition',
    description: 'See how inputs contribute to final scores.',
    icon: PieChart,
    empty: 'Composition breakdowns show up here.',
  },
]

export function AnalyticsView() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Overview"
        title="Analytics"
        description="Explore performance trends and insights across your models and data."
      />
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground/60 uppercase font-semibold">Win Rate</p>
                <p className="text-2xl font-bold mt-1">68%</p>
              </div>
              <LineChart className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground/60 uppercase font-semibold">ROI</p>
                <p className="text-2xl font-bold mt-1">+12.4%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground/60 uppercase font-semibold">Plays</p>
                <p className="text-2xl font-bold mt-1">247</p>
              </div>
              <PieChart className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground/60 uppercase font-semibold">Confidence</p>
                <p className="text-2xl font-bold mt-1">78%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {PANELS.map((panel) => (
          <Card key={panel.title}>
            <CardHeader>
              <CardTitle>{panel.title}</CardTitle>
              <CardDescription>{panel.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={panel.icon}
                title="Awaiting data"
                description={panel.empty}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}
