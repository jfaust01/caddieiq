import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface RankingsTableSkeletonProps {
  rows?: number
}

/** Loading placeholder mirroring the rankings table layout. */
export function RankingsTableSkeleton({ rows = 8 }: RankingsTableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-14 text-center">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="hidden md:table-cell">Country</TableHead>
            <TableHead className="text-right">Overall</TableHead>
            <TableHead className="text-center">Trend</TableHead>
            <TableHead className="hidden lg:table-cell">Recent Form</TableHead>
            <TableHead className="hidden text-center xl:table-cell">
              Course Fit
            </TableHead>
            <TableHead className="hidden text-center sm:table-cell">
              Value
            </TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="text-center">
                <Skeleton className="mx-auto h-4 w-4" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-6 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-8" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="mx-auto h-4 w-10" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-6 w-32" />
              </TableCell>
              <TableCell className="hidden text-center xl:table-cell">
                <Skeleton className="mx-auto h-6 w-9" />
              </TableCell>
              <TableCell className="hidden text-center sm:table-cell">
                <Skeleton className="mx-auto h-6 w-9" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-6 w-14" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
