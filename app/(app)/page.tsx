import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { FeatureCard } from '@/components/cards/feature-card'
import { SectionHeader } from '@/components/shared/section-header'
import { PageShell } from '@/components/shared/page-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { primaryNavigation } from '@/constants/navigation'
import { siteConfig } from '@/constants/site'

export default function HomePage() {
  const features = primaryNavigation.flatMap((section) => section.items)

  return (
    <PageShell>
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface px-6 py-12 sm:px-10 sm:py-16">
        <div className="flex max-w-2xl flex-col gap-5">
          <Badge variant="secondary" className="w-fit gap-1.5">
            <Sparkles className="size-3.5" />
            The golf analytics workspace
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
            {siteConfig.tagline}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
            {siteConfig.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" render={<Link href="/dashboard" />}>
              Open dashboard
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/models" />}>
              Build a model
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeader
          title="Everything you need to build an edge"
          description="A modular workspace that scales from a single custom model to an entire analytics operation."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.href}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              href={feature.href}
            />
          ))}
        </div>
      </section>
    </PageShell>
  )
}
