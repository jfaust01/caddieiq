import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface LeaderboardTabProps {
  tournament: any
}

export function LeaderboardTab({ tournament }: LeaderboardTabProps) {
  const matchScores = tournament.matchScores || []

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Pos</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">R1</TableHead>
            <TableHead className="text-right">R2</TableHead>
            <TableHead className="text-right">R3</TableHead>
            <TableHead className="text-right">R4</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matchScores.map((score: any, idx: number) => (
            <TableRow key={score.id} className={idx % 2 === 0 ? 'bg-card/50' : ''}>
              <TableCell className="font-medium">{score.position || idx + 1}</TableCell>
              <TableCell>
                <a href={`/historical/players/${score.player.id}`} className="hover:underline">
                  {score.player.firstName} {score.player.lastName}
                </a>
              </TableCell>
              <TableCell className="text-right font-semibold">{score.score}</TableCell>
              <TableCell className="text-right text-sm">{score.round1Score || '-'}</TableCell>
              <TableCell className="text-right text-sm">{score.round2Score || '-'}</TableCell>
              <TableCell className="text-right text-sm">{score.round3Score || '-'}</TableCell>
              <TableCell className="text-right text-sm">{score.round4Score || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
