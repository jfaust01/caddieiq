import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface StatTableRow {
  /** Unique row identifier. */
  id: string
  /** Columns in order matching headers. Each can be string, number, or ReactNode. */
  cells: Array<string | number | React.ReactNode>
  /** Optional highlight color (success, warning, etc.). */
  highlight?: 'success' | 'warning' | 'danger'
}

export interface StatTableProps {
  title: string
  /** Column headers. */
  headers: string[]
  /** Table rows. */
  rows: StatTableRow[]
  /** Optional subtitle. */
  subtitle?: string
  /** Optional footer text. */
  footerText?: string
  /** Additional CSS classes. */
  className?: string
}

/**
 * Reusable table component for course history, tournament history, and comparable stats.
 * Responsive and darkmode-friendly.
 */
export function StatTable({
  title,
  headers,
  rows,
  subtitle,
  footerText,
  className,
}: StatTableProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && (
          <p className="text-sm text-muted-foreground pt-1">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, idx) => (
                      <TableHead key={idx} className="text-xs font-semibold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        row.highlight === 'success' && 'bg-success/5',
                        row.highlight === 'warning' && 'bg-amber-500/5',
                        row.highlight === 'danger' && 'bg-destructive/5',
                      )}
                    >
                      {row.cells.map((cell, idx) => (
                        <TableCell key={idx} className="text-sm">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {footerText && (
              <p className="text-xs text-muted-foreground pt-4">{footerText}</p>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
