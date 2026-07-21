import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface OddsTabProps {
  tournament: any
}

export function OddsTab({ tournament }: OddsTabProps) {
  const odds = tournament.oddsQuotes || []

  if (odds.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No odds data available for this tournament
      </div>
    )
  }

  // Group by market
  const marketGroups = odds.reduce((acc: any, odd: any) => {
    if (!acc[odd.market]) {
      acc[odd.market] = []
    }
    acc[odd.market].push(odd)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(marketGroups).map(([market, quotes]: [string, any]) => (
        <div key={market}>
          <h3 className="text-lg font-semibold mb-3 capitalize">{market}</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Selection</TableHead>
                  <TableHead className="text-right">Decimal</TableHead>
                  <TableHead className="text-right">American</TableHead>
                  <TableHead className="text-right">Implied %</TableHead>
                  <TableHead className="text-right">Bookmaker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{quote.selection}</TableCell>
                    <TableCell className="text-right">{quote.decimalOdds?.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {quote.americanOdds > 0 ? '+' : ''}{quote.americanOdds}
                    </TableCell>
                    <TableCell className="text-right">
                      {(quote.impliedProbability * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right capitalize text-sm text-muted-foreground">
                      {quote.bookmakerKey}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
