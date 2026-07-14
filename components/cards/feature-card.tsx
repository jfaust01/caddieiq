import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  href?: string
  badge?: React.ReactNode
}

export function FeatureCard({ title, description, icon: Icon, href, badge }: FeatureCardProps) {
  const content = (
    <Card
      variant="interactive"
      className="group h-full"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground ring-1 ring-foreground/8">
            <Icon className="size-4" />
          </span>
          <div className="flex items-center gap-2">
            {badge}
            {href && (
              <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform duration-[140ms] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            )}
          </div>
        </div>
        <CardTitle className="mt-3 text-sm">{title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto" />
    </Card>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {content}
      </Link>
    )
  }

  return content
}
