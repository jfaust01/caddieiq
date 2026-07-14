'use client'

import { Sparkles } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AiInsightCardProps {
  className?: string
}

/**
 * Placeholder for the future AI model analysis. The Ranking Engine already
 * exposes an explanation seam; this card previews where a generated rationale
 * ("why these weights produce this ranking", risk callouts, suggested tweaks)
 * will surface.
 *
 * TODO(ai): wire to the AI SDK + ranking explanation endpoint. Disabled in v1.
 */
export function AiInsightCard({ className }: AiInsightCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-muted-foreground" aria-hidden />
          AI analysis
        </CardTitle>
        <Badge variant="outline">Soon</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground text-pretty">
          Generate a plain-language breakdown of how your weights shape this
          ranking, plus risk callouts and suggested adjustments.
        </p>
        <Button variant="secondary" size="sm" disabled className="w-fit">
          Analyze model
        </Button>
      </CardContent>
    </Card>
  )
}
