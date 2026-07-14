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
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  href,
}: FeatureCardProps) {
  const content = (
    <Card className="group h-full transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </span>
          {href ? (
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
          ) : null}
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription className="leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto" />
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {content}
      </Link>
    )
  }

  return content
}
