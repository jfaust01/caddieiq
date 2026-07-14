import { Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Placeholder for the AI-powered player insight card.
 *
 * TODO(ai): generate a grounded summary of form, strengths, and weaknesses via
 * the AI layer once model + stats data is available.
 */
export function AiSummaryCard() {
  return (
    <Card className="ring-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <CardTitle>AI Player Insight</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            Coming soon
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          This feature will provide AI-powered explanations of player form,
          strengths, weaknesses, and model rankings.
        </p>
      </CardContent>
    </Card>
  )
}
