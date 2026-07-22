'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, TrendingUp } from 'lucide-react'

interface KeyNumber {
  label: string
  value: string | number | null
  unit?: string
  trend?: 'up' | 'down' | null
  explanation?: string
}

interface TournamentKeyNumbersProps {
  numbers: KeyNumber[]
}

/**
 * Tournament Key Numbers component.
 * Displays critical metrics: winning scores, cut lines, field strength, etc.
 * These are the numbers that matter for fantasy golf decision-making.
 */
export function TournamentKeyNumbers({ numbers }: TournamentKeyNumbersProps) {
  const filledNumbers = numbers.filter(n => n.value !== null && n.value !== undefined)

  if (filledNumbers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Tournament key metrics not yet available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Numbers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {filledNumbers.map((num, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {num.label}
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  {num.value}
                </div>
                {num.unit && <div className="text-xs text-muted-foreground">{num.unit}</div>}
                {num.trend && (
                  <div className={num.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {num.trend === 'up' ? (
                      <TrendingUp className="size-4" />
                    ) : (
                      <TrendingDown className="size-4" />
                    )}
                  </div>
                )}
              </div>
              {num.explanation && (
                <div className="text-xs text-muted-foreground mt-1">{num.explanation}</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
