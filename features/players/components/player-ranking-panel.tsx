import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerRankingCard } from '@/features/players/components/player-ranking-card'
import type { PlayerRanking } from '@/features/players/types'

interface PlayerRankingPanelProps {
  rankings: PlayerRanking[]
}

/** Current rankings across every system CaddieIQ tracks. */
export function PlayerRankingPanel({ rankings }: PlayerRankingPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Rankings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rankings.map((ranking) => (
          <PlayerRankingCard key={ranking.system} ranking={ranking} />
        ))}
      </CardContent>
    </Card>
  )
}
