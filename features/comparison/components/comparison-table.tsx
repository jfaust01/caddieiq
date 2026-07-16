import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ComparisonResult, MetricComparison } from "@/lib/comparison"

interface ComparisonTableProps {
  result: ComparisonResult
  showDifference?: boolean
}

const METRIC_COLORS: Record<string, { bg: string; text: string }> = {
  ELITE: { bg: "bg-green-500/10", text: "text-green-700 dark:text-green-400" },
  STRONG: { bg: "bg-green-400/10", text: "text-green-600 dark:text-green-300" },
  SOLID: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400" },
  AVERAGE: { bg: "bg-yellow-500/10", text: "text-yellow-700 dark:text-yellow-400" },
  DEVELOPING: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-400" },
}

export function ComparisonTable({ result, showDifference }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/50">
          <TableRow>
            <TableHead className="w-32 font-semibold">Metric</TableHead>
            {result.playerNames.map((name, idx) => (
              <TableHead
                key={idx}
                className="min-w-24 text-center font-semibold"
              >
                {name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Overall Rating row */}
          <TableRow className="border-b-2 bg-muted/30">
            <TableCell className="font-bold">Overall Rating</TableCell>
            {result.overallRating.values.map((val, idx) => (
              <TableCell
                key={idx}
                className={cn(
                  "text-center font-semibold",
                  result.overallRating.winner?.playerId === val.playerId
                    ? "rounded bg-primary/20"
                    : "",
                )}
              >
                {val.rating !== null ? (
                  <span
                    className={cn(
                      "inline-block px-2 py-1 rounded",
                      val.band ? METRIC_COLORS[val.band]?.bg : "bg-gray-100",
                      val.band ? METRIC_COLORS[val.band]?.text : "text-gray-600",
                    )}
                  >
                    {val.rating.toFixed(0)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            ))}
          </TableRow>

          {/* Individual metrics */}
          {result.metrics.map((metric) => (
            <TableRow key={metric.key}>
              <TableCell className="font-medium">{metric.label}</TableCell>
              {metric.values.map((val, idx) => (
                <TableCell
                  key={idx}
                  className={cn(
                    "text-center",
                    metric.winner?.playerId === val.playerId
                      ? "rounded bg-green-500/10 font-semibold"
                      : "",
                  )}
                >
                  {val.value !== null ? (
                    <span
                      className={cn(
                        "inline-block px-2 py-1 rounded",
                        val.band ? METRIC_COLORS[val.band]?.bg : "bg-gray-100",
                        val.band ? METRIC_COLORS[val.band]?.text : "text-gray-600",
                      )}
                    >
                      {val.value.toFixed(0)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
