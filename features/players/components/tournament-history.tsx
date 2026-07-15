import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TournamentHistoryEntry } from '@/features/players/types'

interface TournamentHistoryProps {
  history: TournamentHistoryEntry[]
}

/** Tournament-history table. Renders an empty state until results are ingested. */
export function TournamentHistory({ history }: TournamentHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tournament results have been imported for this player yet.
          </p>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tournament</TableHead>
              <TableHead className="text-right">Season</TableHead>
              <TableHead className="text-right">Result</TableHead>
              <TableHead className="text-right">To Par</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.tournament}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {entry.season}
                </TableCell>
                <TableCell className="text-right">
                  {entry.result === 'Win' || entry.result === '1st' ? (
                    <Badge variant="secondary">{entry.result}</Badge>
                  ) : (
                    entry.result
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {entry.toPar}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  )
}
