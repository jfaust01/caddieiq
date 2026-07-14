import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CourseHistoryEntry } from '@/features/players/types'

interface CourseHistoryProps {
  history: CourseHistoryEntry[]
}

/** Placeholder course-history table. */
export function CourseHistory({ history }: CourseHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead className="text-right">Rounds</TableHead>
              <TableHead className="text-right">Best</TableHead>
              <TableHead className="text-right">Scoring Avg</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.course}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {entry.rounds}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {entry.bestFinish}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {entry.scoringAverage.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
